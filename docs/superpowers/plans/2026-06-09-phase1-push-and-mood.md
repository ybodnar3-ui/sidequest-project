# SideQuest Phase 1 — Plan 4: Push Notifications + Morning Mood Ritual

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send the owner a daily "your quest awaits" web push (works in the installed iOS PWA), and add a lightweight morning mood check-in that personalizes generation.

**Architecture:** Web Push via VAPID. The service worker (`public/sw.js`) gains `push` + `notificationclick` handlers. An "Enable reminders" control inside the installed PWA requests notification permission, subscribes via `PushManager`, and stores the subscription in a new `push_subscriptions` table. A Vercel Cron hits a secret-protected route `/api/cron/daily` once a day; that route loads all subscriptions and sends a push using the `web-push` library. A mood picker on `/home` writes today's mood to `mood_checkins` (already read by `getOrCreateTodaysQuest`).

**Tech Stack:** `web-push` (VAPID + send), Web Push API + Service Worker, Vercel Cron (`vercel.json`), Supabase, Vitest (key-encoding + auth-guard units).

**iOS reality:** Web Push works only when the app is **installed to the Home Screen** (standalone) on iOS 16.4+. The owner already installed it. Permission must be requested from a user gesture inside the installed PWA.

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/push/vapid.ts` | `urlBase64ToUint8Array` (client key decode) |
| `lib/push/vapid.test.ts` | Encoding tests |
| `lib/push/send.ts` | `sendPushToAll(payload)` server helper (web-push) |
| `supabase/migrations/0002_push_subscriptions.sql` | subscriptions table + RLS |
| `public/sw.js` | Add `push` + `notificationclick` handlers |
| `app/(app)/home/PushSetup.tsx` | "Enable reminders" client control |
| `app/(app)/home/actions.ts` | `savePushSubscription`, `saveMood` server actions |
| `app/(app)/home/MoodCheckin.tsx` | Morning mood picker |
| `app/(app)/home/page.tsx` | Render PushSetup + MoodCheckin |
| `app/api/cron/daily/route.ts` | Cron-triggered daily push (nodejs runtime) |
| `vercel.json` | Cron schedule |

## Env vars (added during execution, also to Vercel)

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — VAPID public key (client subscribes with it)
- `VAPID_PRIVATE_KEY` — VAPID private key (server signs)
- `VAPID_SUBJECT` — `mailto:ybodnar3@gmail.com`
- `CRON_SECRET` — random secret guarding `/api/cron/daily`

---

## Task 1: VAPID keys + web-push install + env

- [ ] **Step 1: Install web-push**
```bash
npm install web-push && npm install -D @types/web-push
```

- [ ] **Step 2: Generate VAPID keys** (run once; capture the output)
```bash
npx --yes web-push generate-vapid-keys --json
```
Copy `publicKey` and `privateKey` from the JSON.

- [ ] **Step 3: Write keys to `.env.local`** (gitignored). Append:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
VAPID_PRIVATE_KEY=<privateKey>
VAPID_SUBJECT=mailto:ybodnar3@gmail.com
CRON_SECRET=<random 32+ char hex>
```
Generate the CRON_SECRET with: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.

- [ ] **Step 4: Add the same vars to Vercel production** (CLI; the project is linked):
```bash
printf '%s' "<publicKey>"  | vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
printf '%s' "<privateKey>" | vercel env add VAPID_PRIVATE_KEY production
printf '%s' "mailto:ybodnar3@gmail.com" | vercel env add VAPID_SUBJECT production
printf '%s' "<cronSecret>" | vercel env add CRON_SECRET production
```

- [ ] **Step 5: Commit** (lockfile only; no secrets are committed)
```bash
git add package.json package-lock.json
git commit -m "chore: add web-push dependency"
```

---

## Task 2: push_subscriptions table

- [ ] **Step 1: Write migration** — create `supabase/migrations/0002_push_subscriptions.sql`:
```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy "own push subs" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply it** (executor applies via psql session pooler, or the human runs it in Supabase SQL Editor). Verify the table exists with RLS enabled.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/0002_push_subscriptions.sql
git commit -m "feat: add push_subscriptions table with RLS"
```

---

## Task 3: VAPID key decode helper (pure, TDD)

The browser `PushManager.subscribe` needs the VAPID public key as a `Uint8Array`. `urlBase64ToUint8Array` converts the base64url string.

- [ ] **Step 1: Failing test** — create `lib/push/vapid.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { urlBase64ToUint8Array } from "./vapid";

describe("urlBase64ToUint8Array", () => {
  it("decodes a base64url string to the right byte length", () => {
    // "BABC" base64url → 3 bytes
    const out = urlBase64ToUint8Array("BABC");
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out.length).toBe(3);
  });
  it("handles url-safe chars (- and _)", () => {
    const out = urlBase64ToUint8Array("-_-_");
    expect(out.length).toBe(3);
    expect(out[0]).toBe(0xfb);
  });
});
```

- [ ] **Step 2: Run, confirm FAIL.**

- [ ] **Step 3: Implement** — create `lib/push/vapid.ts`:
```ts
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
```

- [ ] **Step 4: Run, confirm PASS.**

- [ ] **Step 5: Commit**
```bash
git add lib/push/vapid.ts lib/push/vapid.test.ts
git commit -m "feat: add VAPID base64url decode helper with tests"
```

---

## Task 4: Service worker push handlers

- [ ] **Step 1: Add handlers** — append to `public/sw.js` (keep the existing install/activate/fetch):
```js
self.addEventListener("push", (event) => {
  let data = { title: "SideQuest", body: "Твій квест дня чекає 🎲", url: "/home" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
```

- [ ] **Step 2: Commit**
```bash
git add public/sw.js
git commit -m "feat: handle push and notificationclick in service worker"
```

---

## Task 5: Subscribe flow (PushSetup + savePushSubscription action)

- [ ] **Step 1: Server action** — append to `app/(app)/home/actions.ts` (keep existing imports/exports):
```ts
export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      { onConflict: "endpoint" },
    );
}
```

- [ ] **Step 2: PushSetup component** — create `app/(app)/home/PushSetup.tsx`:
```tsx
"use client";

import { useState } from "react";
import { urlBase64ToUint8Array } from "@/lib/push/vapid";
import { savePushSubscription } from "./actions";

export function PushSetup() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function enable() {
    setMsg("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("error");
        setMsg("Сповіщення не підтримуються. Встанови застосунок на головний екран (Safari → Поділитися → На екран «Початок»).");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        setMsg("Дозвіл на сповіщення не надано.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
      setStatus("ok");
      setMsg("Нагадування увімкнено ✅");
    } catch (e) {
      setStatus("error");
      setMsg("Не вдалося увімкнути сповіщення. На iOS це працює лише у встановленому застосунку.");
    }
  }

  if (status === "ok") {
    return <p className="text-sm text-green-600">{msg}</p>;
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <button onClick={enable} className="rounded-lg border px-4 py-2 text-sm">
        🔔 Увімкнути нагадування
      </button>
      {msg && <p className="max-w-xs text-center text-xs text-red-600">{msg}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Render it** — in `app/(app)/home/page.tsx`, add `import { PushSetup } from "./PushSetup";` and render `<PushSetup />` just above the journal `<Link>`.

- [ ] **Step 4: Verify build** — `npm run build` succeeds.

- [ ] **Step 5: Commit**
```bash
git add "app/(app)/home/actions.ts" "app/(app)/home/PushSetup.tsx" "app/(app)/home/page.tsx"
git commit -m "feat: add enable-reminders push subscription flow"
```

---

## Task 6: Send helper + cron route

- [ ] **Step 1: Send helper** — create `lib/push/send.ts`:
```ts
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; removed: number }> {
  ensureConfigured();
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  let sent = 0;
  let removed = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 404/410 = subscription gone; clean it up.
      if (statusCode === 404 || statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", s.id);
        removed++;
      }
    }
  }
  return { sent, removed };
}
```

- [ ] **Step 2: Cron route** — create `app/api/cron/daily/route.ts`:
```ts
import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push/send";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const result = await sendPushToAll({
    title: "SideQuest 🎲",
    body: "Доброго ранку! Твій квест дня чекає.",
    url: "/home",
  });
  return NextResponse.json({ ok: true, ...result });
}
```

- [ ] **Step 3: Verify build** — `npm run build` succeeds.

- [ ] **Step 4: Commit**
```bash
git add lib/push/send.ts app/api/cron/daily/route.ts
git commit -m "feat: add web-push send helper and secret-guarded cron route"
```

---

## Task 7: Vercel Cron schedule

> Note: Vercel **Hobby** plan cron runs at most **once per day**. We schedule one daily run. Per-user local-hour delivery and multi-user fan-out come with a Pro upgrade in Phase 3. Vercel automatically sends the `Authorization: Bearer <CRON_SECRET>` header to cron routes when `CRON_SECRET` is set in the project env.

- [ ] **Step 1: Create `vercel.json`** at the project root:
```json
{
  "crons": [
    { "path": "/api/cron/daily", "schedule": "0 1 * * *" }
  ]
}
```
> `0 1 * * *` = 01:00 UTC daily (~09:00 Bali / UTC+8 morning). Adjust later when timezone settings land.

- [ ] **Step 2: Commit**
```bash
git add vercel.json
git commit -m "feat: schedule daily push cron on Vercel"
```

---

## Task 8: Morning mood check-in

- [ ] **Step 1: saveMood action** — append to `app/(app)/home/actions.ts`:
```ts
export async function saveMood(mood: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("time_zone")
    .eq("id", user.id)
    .single();
  const today = getQuestDateKey(new Date(), profile?.time_zone ?? "UTC");
  await supabase
    .from("mood_checkins")
    .upsert({ user_id: user.id, checkin_date: today, mood }, { onConflict: "user_id,checkin_date" });
  revalidatePath("/home");
}
```
> `getQuestDateKey` is already imported in actions.ts (added in Plan 3). If not present, add `import { getQuestDateKey } from "@/lib/dates";`.

- [ ] **Step 2: MoodCheckin component** — create `app/(app)/home/MoodCheckin.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { saveMood } from "./actions";

const MOODS: { key: string; emoji: string; label: string }[] = [
  { key: "great", emoji: "😄", label: "Чудово" },
  { key: "good", emoji: "🙂", label: "Добре" },
  { key: "meh", emoji: "😐", label: "Так собі" },
  { key: "low", emoji: "😔", label: "Кисло" },
];

export function MoodCheckin({ current }: { current: string | null }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="w-full max-w-md rounded-xl border p-4">
      <p className="mb-2 text-sm font-medium">Як настрій сьогодні?</p>
      <div className="flex justify-between gap-2">
        {MOODS.map((m) => (
          <button
            key={m.key}
            disabled={pending}
            onClick={() => startTransition(() => saveMood(m.key))}
            className={`flex flex-1 flex-col items-center rounded-lg border p-2 text-xs disabled:opacity-50 ${
              current === m.key ? "border-black bg-gray-100" : ""
            }`}
          >
            <span className="text-xl">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire into home** — in `app/(app)/home/page.tsx`: fetch today's mood and render `<MoodCheckin>` above the quest card. Add:
```tsx
import { MoodCheckin } from "./MoodCheckin";
import { getQuestDateKey } from "@/lib/dates";
```
After loading `user` and `stats`, add:
```tsx
  const { data: profileTz } = await supabase
    .from("profiles")
    .select("time_zone")
    .eq("id", user.id)
    .single();
  const todayKey = getQuestDateKey(new Date(), profileTz?.time_zone ?? "UTC");
  const { data: moodRow } = await supabase
    .from("mood_checkins")
    .select("mood")
    .eq("user_id", user.id)
    .eq("checkin_date", todayKey)
    .maybeSingle();
```
Then render after `<StatsBar>`:
```tsx
      <MoodCheckin current={moodRow?.mood ?? null} />
```

- [ ] **Step 4: Verify build + tests** — `npm run build` + `npm test` green.

- [ ] **Step 5: Commit**
```bash
git add "app/(app)/home/actions.ts" "app/(app)/home/MoodCheckin.tsx" "app/(app)/home/page.tsx"
git commit -m "feat: add morning mood check-in"
```

---

## Task 9: Live verification (owner, on iPhone)

- [ ] Deploy (push to `main` auto-deploys; confirm env vars are in Vercel).
- [ ] Open the **installed** SideQuest PWA on the iPhone (from the Home Screen icon — not Safari tab).
- [ ] Tap **🔔 Увімкнути нагадування** → allow notifications → "Нагадування увімкнено ✅".
- [ ] DB check: a row appears in `push_subscriptions` for the user.
- [ ] Trigger a push manually (controller can curl the deployed route):
  `curl -H "Authorization: Bearer <CRON_SECRET>" https://sidequest-project.vercel.app/api/cron/daily` → `{ ok: true, sent: 1, ... }` and the phone shows a notification.
- [ ] Tap the notification → opens the app at `/home`.
- [ ] Mood: tap a mood emoji → it persists (selected state on reload); today's quest generation now factors it in.

---

## Definition of Done (Plan 4)

- [ ] `npm test` passes (VAPID decode units).
- [ ] `npm run build` succeeds; cron route is `nodejs` runtime.
- [ ] Owner can enable reminders in the installed PWA; subscription stored.
- [ ] Hitting `/api/cron/daily` with the secret delivers a push to the device.
- [ ] Daily Vercel cron scheduled.
- [ ] Mood check-in persists and feeds generation.

## Notes for Plan 5 (Settings)

- Per-user `morning_push_hour` + `time_zone` exist on `profiles` but the cron uses a fixed UTC hour for now. Plan 5 adds the settings UI; true per-user local-hour delivery needs hourly cron (Vercel Pro) — revisit in Phase 3.
