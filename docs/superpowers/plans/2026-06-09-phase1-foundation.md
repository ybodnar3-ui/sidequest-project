# SideQuest Phase 1 — Plan 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an installable Next.js PWA wired to Supabase (database schema + single-user auth), so the owner can install the app on their phone and log in to an empty, authenticated shell.

**Architecture:** Next.js 15 (App Router, TypeScript, Tailwind) deployed on Vercel. PWA capabilities via Serwist (service worker + manifest). Supabase provides Postgres, Auth (email magic link), and Storage. Auth uses `@supabase/ssr` cookie-based sessions so server components and route handlers share the session. The database schema for the whole MVP is created up front via SQL migrations so later plans only add features, not tables.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Serwist (`@serwist/next`), Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Vitest (unit tests), Vercel (hosting).

---

## Roadmap context

This is **Plan 1 of 5** for Phase 1 (MVP). It produces a working, deployable, installable, authenticated empty app. Subsequent plans (quest generation, rewards engine, push+cron, settings) build on this foundation without re-scaffolding.

## File Structure (created/modified by this plan)

| Path | Responsibility |
|------|----------------|
| `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs` | Project + build config |
| `vitest.config.ts`, `vitest.setup.ts` | Unit test runner config |
| `app/layout.tsx` | Root layout, metadata, PWA manifest link, viewport |
| `app/page.tsx` | Landing / redirect to login or app |
| `app/globals.css` | Tailwind base styles |
| `app/(app)/home/page.tsx` | Protected home shell (empty for now) |
| `app/login/page.tsx` | Magic-link login form |
| `app/auth/callback/route.ts` | Exchanges magic-link code for a session |
| `app/auth/signout/route.ts` | Signs the user out |
| `app/manifest.ts` | PWA web app manifest |
| `app/sw.ts` | Serwist service worker entry |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server (cookie-aware) Supabase client |
| `lib/supabase/middleware.ts` | Session-refresh helper for middleware |
| `middleware.ts` | Route protection + session refresh |
| `lib/dates.ts` | `getQuestDateKey()` — local-date key for daily quests (TDD'd) |
| `lib/dates.test.ts` | Unit tests for `getQuestDateKey()` |
| `supabase/migrations/0001_init.sql` | Full MVP database schema + RLS |
| `.env.local` (gitignored) + `.env.example` | Environment variables |
| `public/icons/icon-192.png`, `public/icons/icon-512.png` | PWA icons |

---

## Task 1: Scaffold the Next.js app

**Files:**
- Create: project files via `create-next-app`

- [ ] **Step 1: Scaffold into the current directory**

The repo already exists with `README.md`, `docs/`, `.gitignore`. Scaffold without overwriting them by generating into a temp dir and copying, or use the `.` target and resolve prompts. Run:

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias "@/*" --eslint --no-turbopack --use-npm
```

When prompted that the directory is not empty, choose to continue (it will keep `README.md`/`docs/`/`.gitignore`; if it asks to overwrite `README.md` choose **No**).

- [ ] **Step 2: Verify the dev server boots**

Run:
```bash
npm run dev
```
Expected: server starts on `http://localhost:3000`, default Next.js page renders. Stop with Ctrl-C.

- [ ] **Step 3: Restore our README if the scaffolder overwrote it**

Run:
```bash
git checkout -- README.md
```
Expected: our SideQuest README is intact (not the create-next-app default).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app (TypeScript, Tailwind, App Router)"
```

---

## Task 2: Set up Vitest and the first TDD unit (date key helper)

The daily quest is keyed by the user's **local** calendar date, not UTC — otherwise someone in Bali (UTC+8) gets "tomorrow's" quest at 4pm. `getQuestDateKey(date, timeZone)` returns a `YYYY-MM-DD` string in the given IANA time zone.

**Files:**
- Create: `vitest.config.ts`, `lib/dates.ts`, `lib/dates.test.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
```

Add a test script to `package.json` `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Write the failing test**

Create `lib/dates.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getQuestDateKey } from "./dates";

describe("getQuestDateKey", () => {
  it("returns the local date in Asia/Makassar (Bali, UTC+8)", () => {
    // 2026-06-09T18:30Z is 2026-06-10 02:30 in Bali
    const d = new Date("2026-06-09T18:30:00Z");
    expect(getQuestDateKey(d, "Asia/Makassar")).toBe("2026-06-10");
  });

  it("returns the local date in UTC", () => {
    const d = new Date("2026-06-09T18:30:00Z");
    expect(getQuestDateKey(d, "UTC")).toBe("2026-06-09");
  });

  it("handles year/month rollover", () => {
    const d = new Date("2025-12-31T20:00:00Z");
    expect(getQuestDateKey(d, "Asia/Makassar")).toBe("2026-01-01");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `getQuestDateKey` is not exported / module not found.

- [ ] **Step 5: Write the minimal implementation**

Create `lib/dates.ts`:
```ts
/**
 * Returns the calendar date (YYYY-MM-DD) for the given instant in the given
 * IANA time zone. Used to key the "quest of the day" by the user's local date.
 */
export function getQuestDateKey(date: Date, timeZone: string): string {
  // en-CA locale formats as YYYY-MM-DD, which is exactly the key shape we want.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all three cases green.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts package.json lib/dates.ts lib/dates.test.ts
git commit -m "feat: add getQuestDateKey local-date helper with tests"
```

---

## Task 3: Create the Supabase project and env scaffolding

**Files:**
- Create: `.env.example`, `.env.local` (gitignored)

- [ ] **Step 1: HUMAN ACTION — create the Supabase project**

1. Go to https://supabase.com → sign in → "New project".
2. Name: `sidequest`. Choose a region near you (e.g. Singapore for Bali). Set a strong DB password and save it.
3. Once provisioned, open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secret — server only)

- [ ] **Step 2: Create `.env.example` (committed, no secrets)**

Create `.env.example`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Added in later plans:
# ANTHROPIC_API_KEY=
```

- [ ] **Step 3: Create `.env.local` (gitignored) with real values**

Create `.env.local` and paste the real values from Step 1. Confirm `.env*.local` is gitignored (it is — see `.gitignore`).

- [ ] **Step 4: Commit the example only**

```bash
git add .env.example
git commit -m "chore: add env example for Supabase"
```

---

## Task 4: Create the database schema (full MVP) via migration

Create the whole MVP schema now so later plans only add features. Row-Level Security (RLS) is enabled on every table; policies scope rows to the authenticated user.

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0001_init.sql`:
```sql
-- SideQuest MVP schema. All tables RLS-protected to the owning user.

-- 1. profiles: per-user settings (1 row per auth user)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  time_zone text not null default 'UTC',
  morning_push_hour int not null default 8,        -- 0..23 local hour
  rhythm_mode text not null default 'morning'      -- 'morning' | 'popup' | 'both'
    check (rhythm_mode in ('morning','popup','both')),
  quests_per_day int not null default 1 check (quests_per_day between 1 and 5),
  enabled_categories text[] not null
    default array['social','body','creative','adventure'],
  enabled_reward_modules text[] not null default array['xp'], -- 'xp' always; 'shop','money'
  current_city text,
  current_lat double precision,
  current_lon double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. quests: one generated quest per day (or popup)
create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_date date not null,                         -- local date key
  title text not null,
  description text not null,
  category text not null
    check (category in ('social','body','creative','adventure')),
  est_minutes int not null,
  xp_value int not null default 10,
  source text not null default 'morning'            -- 'morning' | 'popup'
    check (source in ('morning','popup')),
  status text not null default 'pending'            -- 'pending' | 'done' | 'skipped'
    check (status in ('pending','done','skipped')),
  proof_text text,
  proof_url text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index quests_user_date_idx on public.quests (user_id, quest_date);

-- 3. xp_ledger: append-only XP transactions
create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,                               -- + earned, - spent
  reason text not null,                             -- 'quest_done' | 'redeem' | etc.
  quest_id uuid references public.quests(id) on delete set null,
  created_at timestamptz not null default now()
);
create index xp_ledger_user_idx on public.xp_ledger (user_id);

-- 4. streaks: one row per user
create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  best_streak int not null default 0,
  last_done_date date
);

-- 5. custom_rewards: user-defined reward shop items
create table public.custom_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cost_xp int not null check (cost_xp > 0),
  created_at timestamptz not null default now()
);

-- 6. redemptions: log of reward purchases
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid references public.custom_rewards(id) on delete set null,
  cost_xp int not null,
  created_at timestamptz not null default now()
);

-- 7. money_stakes: manual money-bank ledger (no real payments in MVP)
create table public.money_stakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  outcome text not null default 'open'              -- 'open' | 'won' | 'lost'
    check (outcome in ('open','won','lost')),
  note text,
  created_at timestamptz not null default now()
);

-- 8. mood_checkins: daily mood for personalization
create table public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  mood text not null,                               -- e.g. 'great','good','meh','low'
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

-- Enable RLS everywhere
alter table public.profiles       enable row level security;
alter table public.quests         enable row level security;
alter table public.xp_ledger      enable row level security;
alter table public.streaks        enable row level security;
alter table public.custom_rewards enable row level security;
alter table public.redemptions    enable row level security;
alter table public.money_stakes   enable row level security;
alter table public.mood_checkins  enable row level security;

-- Owner-only policies (auth.uid() must match the row's user)
create policy "own profile"  on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own quests"   on public.quests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own xp"       on public.xp_ledger
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own streaks"  on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rewards"  on public.custom_rewards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own redemptions" on public.redemptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own stakes"   on public.money_stakes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own moods"    on public.mood_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile + streak row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: HUMAN ACTION — apply the migration**

Open Supabase Dashboard → **SQL Editor** → New query → paste the entire contents of `supabase/migrations/0001_init.sql` → **Run**.
Expected: "Success. No rows returned."

- [ ] **Step 3: Verify the tables exist**

In Supabase Dashboard → **Table Editor**, confirm all 8 tables are listed (`profiles`, `quests`, `xp_ledger`, `streaks`, `custom_rewards`, `redemptions`, `money_stakes`, `mood_checkins`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat: add full MVP database schema with RLS"
```

---

## Task 5: Wire up Supabase clients (browser + server)

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`

- [ ] **Step 1: Install Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create the browser client**

Create `lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Create the server client**

Create `lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore; middleware refreshes.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Create the middleware session helper**

Create `lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the app area: unauthenticated users go to /login
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/home");
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/supabase package.json package-lock.json
git commit -m "feat: add Supabase browser/server/middleware clients"
```

---

## Task 6: Add route-protection middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create the middleware**

Create `middleware.ts` (project root):
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets and the service worker
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/).*)",
  ],
};
```

- [ ] **Step 2: Verify the app still builds**

Run:
```bash
npm run build
```
Expected: build succeeds (no type errors). Auth isn't testable yet without the login page, added next.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add session-refresh + route-protection middleware"
```

---

## Task 7: Build the login flow (magic link)

**Files:**
- Create: `app/login/page.tsx`, `app/auth/callback/route.ts`, `app/auth/signout/route.ts`

- [ ] **Step 1: Create the login page**

Create `app/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">SideQuest</h1>
      {sent ? (
        <p className="text-center">
          Перевір пошту — ми надіслали посилання для входу на <b>{email}</b>.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border p-3"
          />
          <button className="rounded-lg bg-black p-3 text-white" type="submit">
            Надіслати посилання для входу
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Create the auth callback route**

Create `app/auth/callback/route.ts`:
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/home`);
    }
  }
  return NextResponse.redirect(`${origin}/login`);
}
```

- [ ] **Step 3: Create the signout route**

Create `app/auth/signout/route.ts`:
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), { status: 302 });
}
```

- [ ] **Step 4: HUMAN ACTION — configure Supabase Auth redirect URLs**

In Supabase Dashboard → **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000`
- Additional Redirect URLs: add `http://localhost:3000/auth/callback` (and later your Vercel URL + `/auth/callback`).

Confirm **Authentication → Providers → Email** is enabled (it is by default).

- [ ] **Step 5: Commit**

```bash
git add app/login app/auth
git commit -m "feat: add magic-link login, auth callback, and signout"
```

---

## Task 8: Build the protected home shell

**Files:**
- Create: `app/(app)/home/page.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create the protected home page**

Create `app/(app)/home/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Привіт, мандрівнику 👋</h1>
      <p className="text-center text-gray-600">
        Тут зʼявлятиметься твій квест дня. Поки що порожньо — будуємо далі.
      </p>
      <form action="/auth/signout" method="post">
        <button className="rounded-lg border px-4 py-2 text-sm" type="submit">
          Вийти
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Make the root page redirect to home (middleware sends to login if needed)**

Replace `app/page.tsx` with:
```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/home");
}
```

- [ ] **Step 3: Manually verify the auth loop end-to-end**

Run `npm run dev`. Then:
1. Visit `http://localhost:3000` → should redirect to `/login`.
2. Enter your email → submit → "Перевір пошту".
3. Open the magic link from your inbox → should land on `/home` showing "Привіт, мандрівнику".
4. Click "Вийти" → back to `/login`.
5. Visit `/home` directly while logged out → redirected to `/login`.

Expected: all five behaviors hold.

- [ ] **Step 4: Verify a profile row was auto-created**

In Supabase → Table Editor → `profiles`: confirm one row exists with your user id (created by the `handle_new_user` trigger). Confirm `streaks` also has a row.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)" app/page.tsx
git commit -m "feat: add protected home shell and root redirect"
```

---

## Task 9: Make it an installable PWA (manifest + icons + service worker)

**Files:**
- Create: `app/manifest.ts`, `app/sw.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Modify: `next.config.ts`, `app/layout.tsx`

- [ ] **Step 1: Install Serwist**

```bash
npm install @serwist/next && npm install -D serwist
```

- [ ] **Step 2: Add the web app manifest**

Create `app/manifest.ts`:
```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SideQuest",
    short_name: "SideQuest",
    description: "Один персональний сайд-квест щодня.",
    start_url: "/home",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

- [ ] **Step 3: Add app icons**

Create two PNG icons at `public/icons/icon-192.png` (192×192) and `public/icons/icon-512.png` (512×512). For now generate solid-color placeholders with a "SQ" mark using any tool, or run:
```bash
mkdir -p public/icons
# Placeholder generation (requires ImageMagick `magick`/`convert`). If unavailable,
# create the two PNGs manually at the listed sizes.
magick -size 512x512 xc:'#4f46e5' -gravity center -pointsize 220 -fill white \
  -annotate 0 'SQ' public/icons/icon-512.png
magick public/icons/icon-512.png -resize 192x192 public/icons/icon-192.png
```
Expected: both PNG files exist at the listed sizes.

- [ ] **Step 4: Create the service worker entry**

Create `app/sw.ts`:
```ts
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

- [ ] **Step 5: Wire Serwist into the Next config**

Replace `next.config.ts` with:
```ts
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({});
```

> Note: PWA/service worker is disabled in dev to avoid caching headaches; it activates in production builds.

- [ ] **Step 6: Reference the manifest + viewport in the root layout**

Ensure `app/layout.tsx` exports metadata + viewport. Set its contents to:
```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SideQuest",
  description: "Один персональний сайд-квест щодня.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "SideQuest" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Build and verify the service worker is generated**

Run:
```bash
npm run build
```
Expected: build succeeds and `public/sw.js` is generated.

- [ ] **Step 8: Verify installability in production mode**

Run:
```bash
npm run start
```
Open `http://localhost:3000` in Chrome → DevTools → **Application → Manifest**: confirm name "SideQuest", icons load, no errors. **Application → Service Workers**: confirm `sw.js` is activated. Lighthouse → "Installable" should pass.

- [ ] **Step 9: Add generated SW to gitignore**

Append to `.gitignore`:
```
# Serwist-generated service worker
public/sw.js
public/swe-worker-*.js
```

- [ ] **Step 10: Commit**

```bash
git add app/manifest.ts app/sw.ts app/layout.tsx next.config.ts public/icons .gitignore package.json package-lock.json
git commit -m "feat: make app an installable PWA via Serwist"
```

---

## Task 10: Deploy to Vercel

**Files:** none (configuration in Vercel dashboard)

- [ ] **Step 1: HUMAN ACTION — import the repo into Vercel**

1. Go to https://vercel.com → "Add New… → Project" → import `ybodnar3-ui/sidequest-project`.
2. Framework preset: Next.js (auto-detected). Leave build settings default.
3. **Environment Variables** — add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and set `NEXT_PUBLIC_SITE_URL` to the Vercel production URL (e.g. `https://sidequest-project.vercel.app`).
4. Deploy.

- [ ] **Step 2: HUMAN ACTION — add the production redirect URL to Supabase**

In Supabase → Authentication → URL Configuration: set Site URL to the Vercel URL and add `<vercel-url>/auth/callback` to redirect URLs.

- [ ] **Step 3: Verify the deployed app**

On your phone: open the Vercel URL → log in via magic link → land on `/home`. In Safari (iOS): Share → **Add to Home Screen** → confirm the SideQuest icon installs and opens standalone.

- [ ] **Step 4: Commit any config notes**

Document the production URL in the README under Status, then:
```bash
git add README.md
git commit -m "docs: note production URL"
```

---

## Definition of Done (Plan 1)

- [ ] `npm test` passes (date helper).
- [ ] `npm run build` succeeds with no type errors.
- [ ] Locally: visiting `/` redirects to `/login`; magic-link login lands on `/home`; signout works; `/home` is protected.
- [ ] A `profiles` row and `streaks` row are auto-created on first login.
- [ ] Production build generates `public/sw.js`; Chrome reports the app installable.
- [ ] Deployed to Vercel; installable on the owner's phone via "Add to Home Screen".
- [ ] All 8 tables exist in Supabase with RLS enabled.

---

## Notes for the next plan (Plan 2: Quest of the Day)

- `ANTHROPIC_API_KEY` env var gets added then.
- Quest generation will write to `public.quests` keyed by `getQuestDateKey(new Date(), profile.time_zone)`.
- Open-Meteo needs no key; city/coords come from `profiles.current_*`.
