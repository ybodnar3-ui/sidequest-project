# SideQuest Phase 1 — Plan 5: Settings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/settings` page where the owner controls which categories quests draw from, their time zone (so "today" matches their real local day), the rhythm mode + quests/day, and the morning push hour.

**Architecture:** A server component loads the `profiles` row and renders a `SettingsForm` client component. A `saveSettings` server action writes the chosen fields back to `profiles` (RLS-scoped). Category list and timezone options come from small constants. The category toggles and time zone take real effect immediately (read by `getOrCreateTodaysQuest`); rhythm mode, quests/day, and push hour are persisted for future per-hour/popup delivery (Phase 3).

**Tech Stack:** Next.js server action, Supabase server client, Vitest (none new — UI/integration).

## File Structure

| Path | Responsibility |
|------|----------------|
| `app/(app)/settings/page.tsx` | Loads profile, renders form |
| `app/(app)/settings/SettingsForm.tsx` | The settings UI (client) |
| `app/(app)/settings/actions.ts` | `saveSettings` server action |
| `app/(app)/home/page.tsx` | Add a "Налаштування ⚙️" link |

---

## Task 1: saveSettings action

**Files:** Create `app/(app)/settings/actions.ts`

- [ ] **Step 1: Implement**
```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { QUEST_CATEGORIES } from "@/lib/quests/schema";

export interface SettingsInput {
  enabled_categories: string[];
  time_zone: string;
  rhythm_mode: "morning" | "popup" | "both";
  quests_per_day: number;
  morning_push_hour: number;
}

export async function saveSettings(input: SettingsInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Validate / clamp.
  const categories = input.enabled_categories.filter((c) =>
    (QUEST_CATEGORIES as readonly string[]).includes(c),
  );
  const rhythm = ["morning", "popup", "both"].includes(input.rhythm_mode)
    ? input.rhythm_mode
    : "morning";
  const perDay = Math.min(5, Math.max(1, Math.round(input.quests_per_day)));
  const hour = Math.min(23, Math.max(0, Math.round(input.morning_push_hour)));

  await supabase
    .from("profiles")
    .update({
      enabled_categories: categories.length ? categories : [...QUEST_CATEGORIES],
      time_zone: input.time_zone,
      rhythm_mode: rhythm,
      quests_per_day: perDay,
      morning_push_hour: hour,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/home");
}
```

- [ ] **Step 2: Commit**
```bash
git add "app/(app)/settings/actions.ts"
git commit -m "feat: add saveSettings server action"
```

---

## Task 2: SettingsForm component

**Files:** Create `app/(app)/settings/SettingsForm.tsx`

- [ ] **Step 1: Implement**
```tsx
"use client";

import { useState, useTransition } from "react";
import { saveSettings, type SettingsInput } from "./actions";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "social", label: "Соціальні" },
  { key: "body", label: "Тіло / рух" },
  { key: "creative", label: "Творчість / навчання" },
  { key: "adventure", label: "Пригоди / місто" },
];

const TIMEZONES: { value: string; label: string }[] = [
  { value: "Asia/Makassar", label: "Балі (UTC+8)" },
  { value: "Asia/Shanghai", label: "Китай (UTC+8)" },
  { value: "Asia/Bangkok", label: "Бангкок (UTC+7)" },
  { value: "Europe/Kyiv", label: "Київ (UTC+2/3)" },
  { value: "Europe/Lisbon", label: "Лісабон (UTC+0/1)" },
  { value: "Europe/Berlin", label: "Берлін (UTC+1/2)" },
  { value: "America/New_York", label: "Нью-Йорк (UTC-5/4)" },
  { value: "UTC", label: "UTC" },
];

const RHYTHMS: { value: SettingsInput["rhythm_mode"]; label: string }[] = [
  { value: "morning", label: "Ранковий" },
  { value: "popup", label: "Рандом-попап" },
  { value: "both", label: "Ранковий + попапи" },
];

export function SettingsForm(props: { initial: SettingsInput }) {
  const [cats, setCats] = useState<string[]>(props.initial.enabled_categories);
  const [tz, setTz] = useState(props.initial.time_zone);
  const [rhythm, setRhythm] = useState(props.initial.rhythm_mode);
  const [perDay, setPerDay] = useState(props.initial.quests_per_day);
  const [hour, setHour] = useState(props.initial.morning_push_hour);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setSaved(false);
    setCats((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  }

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveSettings({
        enabled_categories: cats,
        time_zone: tz,
        rhythm_mode: rhythm,
        quests_per_day: perDay,
        morning_push_hour: hour,
      });
      setSaved(true);
    });
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section>
        <h2 className="mb-2 font-semibold">Категорії квестів</h2>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cats.includes(c.key)}
                onChange={() => toggle(c.key)}
              />
              {c.label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Часовий пояс</h2>
        <select
          value={tz}
          onChange={(e) => { setTz(e.target.value); setSaved(false); }}
          className="w-full rounded-lg border p-2"
        >
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">Визначає, коли в тебе починається новий «день квесту».</p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Ритм</h2>
        <div className="flex flex-col gap-2">
          {RHYTHMS.map((r) => (
            <label key={r.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="rhythm"
                checked={rhythm === r.value}
                onChange={() => { setRhythm(r.value); setSaved(false); }}
              />
              {r.label}
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center justify-between text-sm">
          Квестів на день
          <input
            type="number"
            min={1}
            max={5}
            value={perDay}
            onChange={(e) => { setPerDay(Number(e.target.value)); setSaved(false); }}
            className="w-16 rounded-lg border p-1 text-center"
          />
        </label>
        <label className="mt-2 flex items-center justify-between text-sm">
          Година ранкового нагадування
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => { setHour(Number(e.target.value)); setSaved(false); }}
            className="w-16 rounded-lg border p-1 text-center"
          />
        </label>
        <p className="mt-1 text-xs text-gray-400">Попапи й персональна година — у наступній версії; поки нагадування раз на день.</p>
      </section>

      <button
        onClick={save}
        disabled={pending}
        className="rounded-lg bg-black p-3 text-white disabled:opacity-50"
      >
        {pending ? "Зберігаю…" : "Зберегти"}
      </button>
      {saved && <p className="text-center text-sm text-green-600">Збережено ✅</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add "app/(app)/settings/SettingsForm.tsx"
git commit -m "feat: add settings form UI"
```

---

## Task 3: /settings page + home link

**Files:** Create `app/(app)/settings/page.tsx`; modify `app/(app)/home/page.tsx`

- [ ] **Step 1: Settings page**
```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SettingsForm } from "./SettingsForm";
import { QUEST_CATEGORIES } from "@/lib/quests/schema";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: p } = await supabase
    .from("profiles")
    .select("enabled_categories, time_zone, rhythm_mode, quests_per_day, morning_push_hour")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Налаштування ⚙️</h1>
        <Link href="/home" className="text-sm underline">← Додому</Link>
      </div>
      <SettingsForm
        initial={{
          enabled_categories: p?.enabled_categories ?? [...QUEST_CATEGORIES],
          time_zone: p?.time_zone ?? "UTC",
          rhythm_mode: p?.rhythm_mode ?? "morning",
          quests_per_day: p?.quests_per_day ?? 1,
          morning_push_hour: p?.morning_push_hour ?? 8,
        }}
      />
    </main>
  );
}
```

- [ ] **Step 2: Home link** — in `app/(app)/home/page.tsx`, add a `<Link href="/settings" className="text-sm underline">Налаштування ⚙️</Link>` near the journal link.

- [ ] **Step 3: Verify build + tests** — `npm run build` + `npm test` green.

- [ ] **Step 4: Commit**
```bash
git add "app/(app)/settings/page.tsx" "app/(app)/home/page.tsx"
git commit -m "feat: add settings page and home link"
```

---

## Task 4: Live verification

- [ ] Open `/settings` (logged in). Toggle off a category (e.g. Adventure) → Save → "Збережено ✅".
- [ ] Set time zone to "Балі (UTC+8)" → Save.
- [ ] DB check: `profiles` row reflects the new `enabled_categories` and `time_zone`.
- [ ] Tomorrow's quest (or after deleting today's for a re-gen) only draws from enabled categories.

## Definition of Done (Plan 5)

- [ ] `npm run build` + `npm test` pass.
- [ ] Settings persist to `profiles`; category + timezone changes take effect in generation/day calculation.
- [ ] Home links to settings.

## End of Phase 1 (MVP)

With Plans 1–5 done, the MVP is complete: installable PWA, Google login, AI quest of the day with context, rewards (XP/levels/streaks/journal), push reminders + mood, and settings. Next milestones (Phase 2/3): reward modules (shop, money ledger), multi-user onboarding, custom domain email, subscriptions.
