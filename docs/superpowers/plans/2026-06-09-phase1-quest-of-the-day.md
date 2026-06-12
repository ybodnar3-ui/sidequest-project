# SideQuest Phase 1 — Plan 2: Quest of the Day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate one personalized AI quest per day from the user's context (city, weather, mood, enabled categories, recent history), store it, and display it on `/home` with a "complete" action.

**Architecture:** Server-side quest generation using the official Anthropic SDK (`@anthropic-ai/sdk`) with structured outputs (`messages.parse()` + Zod). Weather from Open-Meteo (no key). A server action `getOrCreateTodaysQuest()` checks the `quests` table for today's quest (keyed by `getQuestDateKey(now, profile.time_zone)`); if absent, it assembles context and generates one. The `/home` server component renders the quest card; completing a quest flips its status. Pure logic (schema, prompt builder, weather parsing, response mapping) is unit-tested with mocks; the live Claude call is verified manually once the API key is set.

**Tech Stack:** Anthropic SDK (`@anthropic-ai/sdk`), Zod (`zod` + `@anthropic-ai/sdk/helpers/zod`), Open-Meteo REST, Supabase (server client), Next.js server actions, Vitest.

**Model note:** Quest generation uses `claude-haiku-4-5` (cheap, fast — the owner explicitly chose Haiku for cost; ~$0.001/quest). Do NOT pass `effort` or `thinking` — Haiku 4.5 does not support them.

---

## Prerequisite (human action)

- `ANTHROPIC_API_KEY` must be set in `.env.local` (a key from console.anthropic.com with credits). Tasks 1–3, 6, 7 and all unit tests do NOT need it; only the live generation in Task 4/5 verification does.

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/quests/schema.ts` | Zod schema + `Quest` types (generated quest shape) |
| `lib/quests/schema.test.ts` | Schema validation tests |
| `lib/weather/openMeteo.ts` | `getWeather(lat, lon)` → compact weather summary |
| `lib/weather/openMeteo.test.ts` | Weather parsing tests (mocked fetch) |
| `lib/quests/prompt.ts` | `buildSystemPrompt()`, `buildUserContext(ctx)` pure builders |
| `lib/quests/prompt.test.ts` | Prompt-builder tests |
| `lib/quests/generate.ts` | `generateQuest(ctx, deps)` — calls Claude, returns `Quest` |
| `lib/quests/generate.test.ts` | Generation tests (mocked Anthropic client) |
| `lib/quests/today.ts` | `getOrCreateTodaysQuest(userId)` — DB read-or-generate orchestration |
| `app/(app)/home/actions.ts` | Server actions: `completeQuest`, `saveLocation` |
| `app/(app)/home/QuestCard.tsx` | Quest card UI (client component) |
| `app/(app)/home/LocationSetup.tsx` | Capture browser geolocation → save to profile |
| `app/(app)/home/page.tsx` | Modified: load today's quest, render card or location prompt |
| `lib/supabase/admin.ts` | Service-role client for trusted server writes (generation insert) |

---

## Task 1: Quest schema + types

**Files:** Create `lib/quests/schema.ts`, `lib/quests/schema.test.ts`

- [ ] **Step 1: Install deps**

```bash
npm install @anthropic-ai/sdk zod
```

- [ ] **Step 2: Write the failing test**

Create `lib/quests/schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { QuestSchema, QUEST_CATEGORIES } from "./schema";

describe("QuestSchema", () => {
  it("accepts a valid quest", () => {
    const q = {
      title: "Say hi to a stranger",
      description: "Strike up a 1-minute chat with someone new nearby.",
      category: "social",
      est_minutes: 10,
      xp_value: 15,
    };
    expect(QuestSchema.parse(q)).toEqual(q);
  });

  it("rejects an unknown category", () => {
    expect(() =>
      QuestSchema.parse({
        title: "x",
        description: "y",
        category: "spaceflight",
        est_minutes: 10,
        xp_value: 10,
      }),
    ).toThrow();
  });

  it("exposes the four categories", () => {
    expect(QUEST_CATEGORIES).toEqual(["social", "body", "creative", "adventure"]);
  });
});
```

- [ ] **Step 3: Run test, confirm it fails** — `npm test` → FAIL (module not found).

- [ ] **Step 4: Implement**

Create `lib/quests/schema.ts`:
```ts
import { z } from "zod";

export const QUEST_CATEGORIES = ["social", "body", "creative", "adventure"] as const;
export type QuestCategory = (typeof QUEST_CATEGORIES)[number];

export const QuestSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(QUEST_CATEGORIES),
  est_minutes: z.number().int(),
  xp_value: z.number().int(),
});

export type GeneratedQuest = z.infer<typeof QuestSchema>;
```

- [ ] **Step 5: Run test, confirm pass** — `npm test` → PASS.

- [ ] **Step 6: Commit**
```bash
git add lib/quests/schema.ts lib/quests/schema.test.ts package.json package-lock.json
git commit -m "feat: add quest Zod schema and category constants"
```

---

## Task 2: Open-Meteo weather client

**Files:** Create `lib/weather/openMeteo.ts`, `lib/weather/openMeteo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/weather/openMeteo.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { summarizeWeather, getWeather } from "./openMeteo";

describe("summarizeWeather", () => {
  it("maps a WMO code + temp into a short summary", () => {
    expect(summarizeWeather(0, 31)).toBe("clear, 31°C");
    expect(summarizeWeather(61, 24)).toBe("rainy, 24°C");
    expect(summarizeWeather(95, 27)).toBe("thunderstorm, 27°C");
  });
});

describe("getWeather", () => {
  it("calls Open-Meteo and returns a summary", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ current: { temperature_2m: 30, weather_code: 2 } }),
    });
    const result = await getWeather(-8.65, 115.21, fetchMock as unknown as typeof fetch);
    expect(result).toBe("partly cloudy, 30°C");
    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("latitude=-8.65");
    expect(url).toContain("longitude=115.21");
  });

  it("returns null on a non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    expect(await getWeather(0, 0, fetchMock as unknown as typeof fetch)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, confirm it fails.**

- [ ] **Step 3: Implement**

Create `lib/weather/openMeteo.ts`:
```ts
// Minimal WMO weather-code → label mapping (grouped to keep it short).
function wmoLabel(code: number): string {
  if (code === 0) return "clear";
  if (code <= 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code >= 45 && code <= 48) return "foggy";
  if (code >= 51 && code <= 67) return "rainy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 80 && code <= 82) return "rain showers";
  if (code >= 95) return "thunderstorm";
  return "mild";
}

export function summarizeWeather(code: number, tempC: number): string {
  return `${wmoLabel(code)}, ${Math.round(tempC)}°C`;
}

export async function getWeather(
  lat: number,
  lon: number,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
  const res = await fetchImpl(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    current?: { temperature_2m: number; weather_code: number };
  };
  if (!data.current) return null;
  return summarizeWeather(data.current.weather_code, data.current.temperature_2m);
}
```

- [ ] **Step 4: Run test, confirm pass.**

- [ ] **Step 5: Commit**
```bash
git add lib/weather
git commit -m "feat: add Open-Meteo weather client with WMO summary"
```

---

## Task 3: Prompt builders

**Files:** Create `lib/quests/prompt.ts`, `lib/quests/prompt.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/quests/prompt.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserContext } from "./prompt";

describe("buildSystemPrompt", () => {
  it("states the core rules (one quest, 5-15 min, categories)", () => {
    const s = buildSystemPrompt();
    expect(s).toContain("5");
    expect(s).toContain("15");
    expect(s.toLowerCase()).toContain("quest");
  });
});

describe("buildUserContext", () => {
  it("includes city, weather, mood, categories, and recent titles", () => {
    const ctx = buildUserContext({
      city: "Bali",
      weather: "clear, 31°C",
      mood: "good",
      categories: ["social", "body"],
      recentTitles: ["Call an old friend"],
    });
    expect(ctx).toContain("Bali");
    expect(ctx).toContain("clear, 31°C");
    expect(ctx).toContain("good");
    expect(ctx).toContain("social");
    expect(ctx).toContain("Call an old friend");
  });

  it("handles missing optional fields gracefully", () => {
    const ctx = buildUserContext({
      city: null,
      weather: null,
      mood: null,
      categories: ["creative"],
      recentTitles: [],
    });
    expect(ctx).toContain("creative");
    expect(typeof ctx).toBe("string");
  });
});
```

- [ ] **Step 2: Run test, confirm it fails.**

- [ ] **Step 3: Implement**

Create `lib/quests/prompt.ts`:
```ts
import type { QuestCategory } from "./schema";

export function buildSystemPrompt(): string {
  return [
    "You are SideQuest, a playful game master that invents ONE small real-life side quest",
    "to make the player's day more varied and fun.",
    "Rules:",
    "- The quest must take 5 to 15 minutes. Never require travel far or spending much money.",
    "- It must be concrete and doable today, alone, wherever the player is.",
    "- Pick exactly one category from the allowed set the player gives you.",
    "- Avoid repeating the player's recent quests.",
    "- title: short and inviting. description: 1-2 sentences, second person, encouraging.",
    "- est_minutes: 5-15. xp_value: 10-25 based on effort.",
  ].join("\n");
}

export interface QuestContext {
  city: string | null;
  weather: string | null;
  mood: string | null;
  categories: QuestCategory[];
  recentTitles: string[];
}

export function buildUserContext(ctx: QuestContext): string {
  const lines = [
    `Location: ${ctx.city ?? "unknown"}`,
    `Weather: ${ctx.weather ?? "unknown"}`,
    `Mood today: ${ctx.mood ?? "unspecified"}`,
    `Allowed categories: ${ctx.categories.join(", ")}`,
    ctx.recentTitles.length
      ? `Recent quests to avoid repeating: ${ctx.recentTitles.join("; ")}`
      : "No recent quests yet.",
    "Invent today's side quest now.",
  ];
  return lines.join("\n");
}
```

- [ ] **Step 4: Run test, confirm pass.**

- [ ] **Step 5: Commit**
```bash
git add lib/quests/prompt.ts lib/quests/prompt.test.ts
git commit -m "feat: add quest prompt builders"
```

---

## Task 4: Quest generator (Anthropic structured output)

**Files:** Create `lib/quests/generate.ts`, `lib/quests/generate.test.ts`

- [ ] **Step 1: Write the failing test** (inject the Anthropic client so no network/key is needed)

Create `lib/quests/generate.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { generateQuest } from "./generate";
import type { QuestContext } from "./prompt";

const ctx: QuestContext = {
  city: "Bali",
  weather: "clear, 31°C",
  mood: "good",
  categories: ["social", "body", "creative", "adventure"],
  recentTitles: [],
};

it("returns the parsed quest from the model", async () => {
  const parsed = {
    title: "Compliment a stranger",
    description: "Give someone nearby a genuine compliment.",
    category: "social",
    est_minutes: 5,
    xp_value: 15,
  };
  const fakeClient = {
    messages: { parse: vi.fn().mockResolvedValue({ parsed_output: parsed }) },
  };
  const quest = await generateQuest(ctx, { client: fakeClient as never });
  expect(quest).toEqual(parsed);
  expect(fakeClient.messages.parse).toHaveBeenCalledOnce();
  const arg = fakeClient.messages.parse.mock.calls[0][0];
  expect(arg.model).toBe("claude-haiku-4-5");
});

it("throws when the model returns no parsed output", async () => {
  const fakeClient = {
    messages: { parse: vi.fn().mockResolvedValue({ parsed_output: null }) },
  };
  await expect(generateQuest(ctx, { client: fakeClient as never })).rejects.toThrow();
});
```

- [ ] **Step 2: Run test, confirm it fails.**

- [ ] **Step 3: Implement**

Create `lib/quests/generate.ts`:
```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { QuestSchema, type GeneratedQuest } from "./schema";
import { buildSystemPrompt, buildUserContext, type QuestContext } from "./prompt";

export interface GenerateDeps {
  client: Anthropic;
}

export async function generateQuest(
  ctx: QuestContext,
  deps: GenerateDeps = { client: new Anthropic() },
): Promise<GeneratedQuest> {
  const response = await deps.client.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserContext(ctx) }],
    output_config: { format: zodOutputFormat(QuestSchema, "quest") },
  });
  if (!response.parsed_output) {
    throw new Error("Quest generation returned no structured output");
  }
  return response.parsed_output;
}
```

> Note: `new Anthropic()` reads `ANTHROPIC_API_KEY` from the environment. The default arg is only constructed when no `deps` is passed (i.e. in production), so tests that inject `client` never touch the env.

- [ ] **Step 4: Run test, confirm pass.**

- [ ] **Step 5: Commit**
```bash
git add lib/quests/generate.ts lib/quests/generate.test.ts
git commit -m "feat: add Anthropic structured-output quest generator"
```

---

## Task 5: getOrCreateTodaysQuest orchestration + admin client

**Files:** Create `lib/supabase/admin.ts`, `lib/quests/today.ts`

- [ ] **Step 1: Admin (service-role) Supabase client**

Create `lib/supabase/admin.ts`:
```ts
import { createClient } from "@supabase/supabase-js";

// Trusted server-only client (bypasses RLS). NEVER import into client components.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 2: Orchestration**

Create `lib/quests/today.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuestDateKey } from "@/lib/dates";
import { getWeather } from "@/lib/weather/openMeteo";
import { generateQuest } from "./generate";
import { QUEST_CATEGORIES, type QuestCategory } from "./schema";

export interface TodaysQuestResult {
  quest: {
    id: string;
    title: string;
    description: string;
    category: string;
    est_minutes: number;
    xp_value: number;
    status: string;
  } | null;
  needsLocation: boolean;
}

export async function getOrCreateTodaysQuest(userId: string): Promise<TodaysQuestResult> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("time_zone, enabled_categories, current_city, current_lat, current_lon")
    .eq("id", userId)
    .single();

  const timeZone = profile?.time_zone ?? "UTC";
  const today = getQuestDateKey(new Date(), timeZone);

  // Already have today's quest?
  const { data: existing } = await supabase
    .from("quests")
    .select("id, title, description, category, est_minutes, xp_value, status")
    .eq("user_id", userId)
    .eq("quest_date", today)
    .eq("source", "morning")
    .maybeSingle();

  if (existing) return { quest: existing, needsLocation: false };

  // Need a location to personalize; if missing, ask the UI to collect it.
  if (profile?.current_lat == null || profile?.current_lon == null) {
    return { quest: null, needsLocation: true };
  }

  // Gather context.
  const weather = await getWeather(profile.current_lat, profile.current_lon);
  const { data: mood } = await supabase
    .from("mood_checkins")
    .select("mood")
    .eq("user_id", userId)
    .eq("checkin_date", today)
    .maybeSingle();
  const { data: recent } = await supabase
    .from("quests")
    .select("title")
    .eq("user_id", userId)
    .order("quest_date", { ascending: false })
    .limit(10);

  const enabled = (profile?.enabled_categories ?? QUEST_CATEGORIES).filter(
    (c: string): c is QuestCategory => (QUEST_CATEGORIES as readonly string[]).includes(c),
  );

  const generated = await generateQuest({
    city: profile?.current_city ?? null,
    weather,
    mood: mood?.mood ?? null,
    categories: enabled.length ? enabled : [...QUEST_CATEGORIES],
    recentTitles: (recent ?? []).map((r) => r.title),
  });

  // Insert with the service-role client (trusted server write).
  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from("quests")
    .insert({
      user_id: userId,
      quest_date: today,
      source: "morning",
      title: generated.title,
      description: generated.description,
      category: generated.category,
      est_minutes: generated.est_minutes,
      xp_value: generated.xp_value,
    })
    .select("id, title, description, category, est_minutes, xp_value, status")
    .single();

  if (error) throw error;
  return { quest: inserted, needsLocation: false };
}
```

- [ ] **Step 3: Verify build/types**

Run: `npm run build`
Expected: compiles (this code isn't statically prerendered; it runs inside the request).

- [ ] **Step 4: Commit**
```bash
git add lib/supabase/admin.ts lib/quests/today.ts
git commit -m "feat: add getOrCreateTodaysQuest orchestration + admin client"
```

---

## Task 6: Home UI — quest card + complete action

**Files:** Create `app/(app)/home/actions.ts`, `app/(app)/home/QuestCard.tsx`; modify `app/(app)/home/page.tsx`

- [ ] **Step 1: Server actions**

Create `app/(app)/home/actions.ts`:
```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeQuest(questId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("quests")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", questId)
    .eq("user_id", user.id);

  revalidatePath("/home");
}

export async function saveLocation(
  city: string,
  lat: number,
  lon: number,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ current_city: city, current_lat: lat, current_lon: lon })
    .eq("id", user.id);

  revalidatePath("/home");
}
```

- [ ] **Step 2: Quest card component**

Create `app/(app)/home/QuestCard.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { completeQuest } from "./actions";

const CATEGORY_LABEL: Record<string, string> = {
  social: "Соціальний",
  body: "Тіло",
  creative: "Творчість",
  adventure: "Пригода",
};

export function QuestCard(props: {
  id: string;
  title: string;
  description: string;
  category: string;
  estMinutes: number;
  xpValue: number;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const done = props.status === "done";

  return (
    <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>{CATEGORY_LABEL[props.category] ?? props.category}</span>
        <span>~{props.estMinutes} хв · {props.xpValue} XP</span>
      </div>
      <h2 className="mb-2 text-xl font-bold">{props.title}</h2>
      <p className="mb-5 text-gray-700">{props.description}</p>
      {done ? (
        <p className="text-center font-semibold text-green-600">✅ Виконано!</p>
      ) : (
        <button
          disabled={pending}
          onClick={() => startTransition(() => completeQuest(props.id))}
          className="w-full rounded-lg bg-black p-3 text-white disabled:opacity-50"
        >
          {pending ? "Зберігаю…" : "Виконати ✅"}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire into the home page**

Replace `app/(app)/home/page.tsx` with:
```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getOrCreateTodaysQuest } from "@/lib/quests/today";
import { QuestCard } from "./QuestCard";
import { LocationSetup } from "./LocationSetup";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { quest, needsLocation } = await getOrCreateTodaysQuest(user.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Квест дня 🎲</h1>
      {needsLocation ? (
        <LocationSetup />
      ) : quest ? (
        <QuestCard
          id={quest.id}
          title={quest.title}
          description={quest.description}
          category={quest.category}
          estMinutes={quest.est_minutes}
          xpValue={quest.xp_value}
          status={quest.status}
        />
      ) : (
        <p className="text-gray-600">Не вдалося згенерувати квест. Онови сторінку.</p>
      )}
      <form action="/auth/signout" method="post">
        <button className="rounded-lg border px-4 py-2 text-sm" type="submit">
          Вийти
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Commit**
```bash
git add "app/(app)/home/actions.ts" "app/(app)/home/QuestCard.tsx" "app/(app)/home/page.tsx"
git commit -m "feat: render daily quest card with complete action"
```

---

## Task 7: Location setup (browser geolocation → profile)

**Files:** Create `app/(app)/home/LocationSetup.tsx`

- [ ] **Step 1: Implement the client component**

Create `app/(app)/home/LocationSetup.tsx`:
```tsx
"use client";

import { useState } from "react";
import { saveLocation } from "./actions";

export function LocationSetup() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function detect() {
    setError(null);
    setBusy(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      const { latitude, longitude } = pos.coords;
      // Reverse-geocode the city name via Open-Meteo's free geocoding.
      let city = "";
      try {
        const r = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1`,
        );
        const j = await r.json();
        city = j?.results?.[0]?.name ?? "";
      } catch {
        /* city is optional */
      }
      await saveLocation(city, latitude, longitude);
    } catch {
      setError("Не вдалося отримати локацію. Дозволь доступ до геолокації та спробуй ще.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col items-center gap-3 text-center">
      <p className="text-gray-700">
        Щоб квести підлаштовувались під твоє місто й погоду, дозволь визначити локацію.
      </p>
      <button
        onClick={detect}
        disabled={busy}
        className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {busy ? "Визначаю…" : "Визначити мою локацію 📍"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

> Note: Open-Meteo geocoding `search` also supports `?name=`; here we use lat/lon proximity. If `results` is empty, city stays empty and quests still work using coordinates + weather.

- [ ] **Step 2: Verify build**

Run: `npm run build` → compiles. `npm test` → still green.

- [ ] **Step 3: Commit**
```bash
git add "app/(app)/home/LocationSetup.tsx"
git commit -m "feat: add geolocation-based location setup"
```

---

## Task 8: Live verification (needs ANTHROPIC_API_KEY)

- [ ] **Step 1:** Confirm `.env.local` has `ANTHROPIC_API_KEY=sk-ant-...`.
- [ ] **Step 2:** `npm run dev`, open `/home` while logged in.
- [ ] **Step 3:** If prompted, click "Визначити мою локацію" → allow geolocation → page reloads.
- [ ] **Step 4:** A generated quest card appears (title, description, category, minutes, XP).
- [ ] **Step 5:** Click "Виконати" → card shows "✅ Виконано!".
- [ ] **Step 6:** Reload → the same quest persists for today (not regenerated), now marked done.
- [ ] **Step 7 (DB check):** A row exists in `quests` for today with `status='done'`.

---

## Definition of Done (Plan 2)

- [ ] `npm test` passes (schema, weather, prompt, generate units).
- [ ] `npm run build` succeeds.
- [ ] Logged-in `/home` shows a personalized quest generated from city/weather/mood/categories.
- [ ] Completing a quest persists `status='done'`; the day's quest is generated once and reused.
- [ ] Quotes the model `claude-haiku-4-5`; structured output validated by Zod.

## Notes for Plan 3 (Rewards engine)

- Completing a quest currently only sets status. Plan 3 adds the XP ledger write, streak update, level calc, celebration animation, and the journal of completed quests.
