# SideQuest Phase 1 — Plan 3: Rewards Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reward quest completion with XP, levels, and streaks; celebrate with a confetti animation; and show a journal of completed quests — turning "mark done" into a satisfying game loop.

**Architecture:** Pure, unit-tested logic for levels (`levelForXp`, progress) and streaks (`computeStreak`, `previousDateKey`). On completion, `completeQuest` does an idempotent `pending → done` conditional update; only on a real transition does it award XP (insert into `xp_ledger`) and update the `streaks` row. A stats reader aggregates total XP → level/progress + streak for a header on `/home`. A confetti burst fires client-side on success. A `/journal` page lists completed quests. All writes use the user's RLS-scoped Supabase client (no admin needed — rows are owner-scoped).

**Tech Stack:** Vitest (pure logic), Supabase server client, Next.js server actions, `canvas-confetti` (celebration).

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/rewards/levels.ts` | `cumXpForLevel`, `levelForXp`, `levelProgress` (pure) |
| `lib/rewards/levels.test.ts` | Level math tests |
| `lib/rewards/streak.ts` | `previousDateKey`, `computeStreak` (pure) |
| `lib/rewards/streak.test.ts` | Streak logic tests |
| `lib/rewards/award.ts` | `awardForQuest(supabase, userId, quest, today)` — XP + streak writes |
| `lib/rewards/stats.ts` | `getRewardStats(userId)` → totals for the UI |
| `app/(app)/home/actions.ts` | Modify `completeQuest` → idempotent award |
| `app/(app)/home/QuestCard.tsx` | Modify → confetti on success |
| `app/(app)/home/StatsBar.tsx` | XP / level / streak header |
| `app/(app)/home/page.tsx` | Modify → render StatsBar |
| `app/(app)/journal/page.tsx` | Completed-quests journal |

---

## Task 1: Level math (pure, TDD)

**Files:** Create `lib/rewards/levels.ts`, `lib/rewards/levels.test.ts`

Curve: cumulative XP to *reach* level L is `cumXpForLevel(L) = 50 * (L-1) * L` → L1=0, L2=100, L3=300, L4=600, L5=1000. Gentle, satisfying early progression.

- [ ] **Step 1: Failing test** — create `lib/rewards/levels.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { cumXpForLevel, levelForXp, levelProgress } from "./levels";

describe("cumXpForLevel", () => {
  it("matches the curve", () => {
    expect(cumXpForLevel(1)).toBe(0);
    expect(cumXpForLevel(2)).toBe(100);
    expect(cumXpForLevel(3)).toBe(300);
    expect(cumXpForLevel(5)).toBe(1000);
  });
});

describe("levelForXp", () => {
  it("returns the right level at boundaries", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
  });
});

describe("levelProgress", () => {
  it("reports xp into the level and to the next", () => {
    const p = levelProgress(150); // level 2 (100..300)
    expect(p.level).toBe(2);
    expect(p.intoLevel).toBe(50);
    expect(p.span).toBe(200);
    expect(p.fraction).toBeCloseTo(0.25, 5);
  });
  it("handles exactly a boundary", () => {
    const p = levelProgress(100);
    expect(p.level).toBe(2);
    expect(p.intoLevel).toBe(0);
    expect(p.fraction).toBe(0);
  });
});
```

- [ ] **Step 2: Run, confirm FAIL.**

- [ ] **Step 3: Implement** — create `lib/rewards/levels.ts`:
```ts
export function cumXpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelForXp(totalXp: number): number {
  let level = 1;
  while (cumXpForLevel(level + 1) <= totalXp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  intoLevel: number;
  span: number;
  fraction: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp);
  const base = cumXpForLevel(level);
  const next = cumXpForLevel(level + 1);
  const span = next - base;
  const intoLevel = totalXp - base;
  return { level, intoLevel, span, fraction: span === 0 ? 0 : intoLevel / span };
}
```

- [ ] **Step 4: Run, confirm PASS.**

- [ ] **Step 5: Commit**
```bash
git add lib/rewards/levels.ts lib/rewards/levels.test.ts
git commit -m "feat: add XP level math with tests"
```

---

## Task 2: Streak logic (pure, TDD)

**Files:** Create `lib/rewards/streak.ts`, `lib/rewards/streak.test.ts`

- [ ] **Step 1: Failing test** — create `lib/rewards/streak.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { previousDateKey, computeStreak } from "./streak";

describe("previousDateKey", () => {
  it("subtracts one calendar day", () => {
    expect(previousDateKey("2026-06-13")).toBe("2026-06-12");
    expect(previousDateKey("2026-01-01")).toBe("2025-12-31");
    expect(previousDateKey("2026-03-01")).toBe("2026-02-28");
  });
});

describe("computeStreak", () => {
  it("starts a streak when there is no prior completion", () => {
    expect(computeStreak(null, "2026-06-13", 0, 0)).toEqual({
      current: 1, best: 1, lastDone: "2026-06-13",
    });
  });
  it("increments when the last completion was yesterday", () => {
    expect(computeStreak("2026-06-12", "2026-06-13", 4, 4)).toEqual({
      current: 5, best: 5, lastDone: "2026-06-13",
    });
  });
  it("does not change when already completed today", () => {
    expect(computeStreak("2026-06-13", "2026-06-13", 5, 7)).toEqual({
      current: 5, best: 7, lastDone: "2026-06-13",
    });
  });
  it("resets to 1 after a gap, keeping best", () => {
    expect(computeStreak("2026-06-10", "2026-06-13", 9, 9)).toEqual({
      current: 1, best: 9, lastDone: "2026-06-13",
    });
  });
});
```

- [ ] **Step 2: Run, confirm FAIL.**

- [ ] **Step 3: Implement** — create `lib/rewards/streak.ts`:
```ts
export function previousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
}

export interface StreakResult {
  current: number;
  best: number;
  lastDone: string;
}

export function computeStreak(
  lastDone: string | null,
  today: string,
  current: number,
  best: number,
): StreakResult {
  if (lastDone === today) {
    return { current, best, lastDone: today };
  }
  const next = lastDone === previousDateKey(today) ? current + 1 : 1;
  return { current: next, best: Math.max(best, next), lastDone: today };
}
```

- [ ] **Step 4: Run, confirm PASS.**

- [ ] **Step 5: Commit**
```bash
git add lib/rewards/streak.ts lib/rewards/streak.test.ts
git commit -m "feat: add streak computation with tests"
```

---

## Task 3: Award orchestration + idempotent completeQuest

**Files:** Create `lib/rewards/award.ts`; modify `app/(app)/home/actions.ts`

- [ ] **Step 1: Award helper** — create `lib/rewards/award.ts`:
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeStreak } from "./streak";

/**
 * Awards XP and updates the streak for a quest that JUST transitioned to done.
 * Call ONLY after a confirmed pending→done transition (so it runs once).
 */
export async function awardForQuest(
  supabase: SupabaseClient,
  userId: string,
  quest: { id: string; xp_value: number },
  today: string,
): Promise<void> {
  await supabase.from("xp_ledger").insert({
    user_id: userId,
    delta: quest.xp_value,
    reason: "quest_done",
    quest_id: quest.id,
  });

  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak, best_streak, last_done_date")
    .eq("user_id", userId)
    .maybeSingle();

  const next = computeStreak(
    streak?.last_done_date ?? null,
    today,
    streak?.current_streak ?? 0,
    streak?.best_streak ?? 0,
  );

  await supabase
    .from("streaks")
    .update({
      current_streak: next.current,
      best_streak: next.best,
      last_done_date: next.lastDone,
    })
    .eq("user_id", userId);
}
```

- [ ] **Step 2: Rewire `completeQuest`** — replace the `completeQuest` function in `app/(app)/home/actions.ts` with:
```ts
export async function completeQuest(questId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Idempotent transition: only the first pending→done update returns a row.
  const { data: transitioned } = await supabase
    .from("quests")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", questId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .select("id, xp_value")
    .maybeSingle();

  if (transitioned) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("time_zone")
      .eq("id", user.id)
      .single();
    const today = getQuestDateKey(new Date(), profile?.time_zone ?? "UTC");
    await awardForQuest(supabase, user.id, transitioned, today);
  }

  revalidatePath("/home");
}
```
Add these imports to the top of `app/(app)/home/actions.ts` (keep existing imports):
```ts
import { getQuestDateKey } from "@/lib/dates";
import { awardForQuest } from "@/lib/rewards/award";
```

- [ ] **Step 3: Verify build** — `npm run build` succeeds; `npm test` still green.

- [ ] **Step 4: Commit**
```bash
git add lib/rewards/award.ts "app/(app)/home/actions.ts"
git commit -m "feat: award XP and update streak on quest completion (idempotent)"
```

---

## Task 4: Stats reader + StatsBar UI

**Files:** Create `lib/rewards/stats.ts`, `app/(app)/home/StatsBar.tsx`; modify `app/(app)/home/page.tsx`

- [ ] **Step 1: Stats reader** — create `lib/rewards/stats.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { levelProgress } from "./levels";

export interface RewardStats {
  totalXp: number;
  level: number;
  fraction: number;
  intoLevel: number;
  span: number;
  currentStreak: number;
  bestStreak: number;
}

export async function getRewardStats(userId: string): Promise<RewardStats> {
  const supabase = await createClient();

  const { data: ledger } = await supabase
    .from("xp_ledger")
    .select("delta")
    .eq("user_id", userId);
  const totalXp = (ledger ?? []).reduce((sum, r: { delta: number }) => sum + r.delta, 0);

  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak, best_streak")
    .eq("user_id", userId)
    .maybeSingle();

  const p = levelProgress(totalXp);
  return {
    totalXp,
    level: p.level,
    fraction: p.fraction,
    intoLevel: p.intoLevel,
    span: p.span,
    currentStreak: streak?.current_streak ?? 0,
    bestStreak: streak?.best_streak ?? 0,
  };
}
```

- [ ] **Step 2: StatsBar component** — create `app/(app)/home/StatsBar.tsx`:
```tsx
export function StatsBar(props: {
  level: number;
  totalXp: number;
  fraction: number;
  intoLevel: number;
  span: number;
  currentStreak: number;
}) {
  return (
    <div className="w-full max-w-md rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">Рівень {props.level}</span>
        <span className="text-gray-500">{props.totalXp} XP</span>
        <span title="Стрік">🔥 {props.currentStreak}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-black transition-all"
          style={{ width: `${Math.round(props.fraction * 100)}%` }}
        />
      </div>
      <div className="mt-1 text-right text-xs text-gray-400">
        {props.intoLevel}/{props.span} до наступного рівня
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Render in home page** — in `app/(app)/home/page.tsx`, after computing `user`, add the stats fetch and render `<StatsBar>` above the quest card. Insert near the top of the component body:
```tsx
import { getRewardStats } from "@/lib/rewards/stats";
import { StatsBar } from "./StatsBar";
```
And inside the component, after the `getOrCreateTodaysQuest` call:
```tsx
  const stats = await getRewardStats(user.id);
```
Then in the JSX, immediately after the `<h1>`:
```tsx
      <StatsBar
        level={stats.level}
        totalXp={stats.totalXp}
        fraction={stats.fraction}
        intoLevel={stats.intoLevel}
        span={stats.span}
        currentStreak={stats.currentStreak}
      />
```

- [ ] **Step 4: Verify build** — `npm run build` succeeds.

- [ ] **Step 5: Commit**
```bash
git add lib/rewards/stats.ts "app/(app)/home/StatsBar.tsx" "app/(app)/home/page.tsx"
git commit -m "feat: add reward stats bar (level, XP, streak) to home"
```

---

## Task 5: Celebration (confetti on completion)

**Files:** modify `app/(app)/home/QuestCard.tsx`

- [ ] **Step 1: Install confetti**
```bash
npm install canvas-confetti && npm install -D @types/canvas-confetti
```

- [ ] **Step 2: Fire confetti on success** — in `app/(app)/home/QuestCard.tsx`, import confetti and fire it when completion finishes. Replace the `onClick` handler so it celebrates after the action resolves:
```tsx
import confetti from "canvas-confetti";
```
Change the button's onClick to:
```tsx
onClick={() =>
  startTransition(async () => {
    await completeQuest(props.id);
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } });
  })
}
```
> `startTransition` accepts an async function here; the confetti fires right after the server action resolves and the UI re-renders to the done state.

- [ ] **Step 3: Verify build** — `npm run build` succeeds.

- [ ] **Step 4: Commit**
```bash
git add "app/(app)/home/QuestCard.tsx" package.json package-lock.json
git commit -m "feat: confetti celebration on quest completion"
```

---

## Task 6: Journal of completed quests

**Files:** Create `app/(app)/journal/page.tsx`; modify `app/(app)/home/page.tsx` (add a link)

- [ ] **Step 1: Journal page** — create `app/(app)/journal/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  social: "Соціальний",
  body: "Тіло",
  creative: "Творчість",
  adventure: "Пригода",
};

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quests } = await supabase
    .from("quests")
    .select("id, title, category, xp_value, quest_date, status, completed_at")
    .eq("user_id", user.id)
    .eq("status", "done")
    .order("completed_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Журнал 📜</h1>
        <Link href="/home" className="text-sm underline">
          ← Додому
        </Link>
      </div>
      {!quests || quests.length === 0 ? (
        <p className="text-gray-500">Ще немає виконаних квестів. Уперед! 🎲</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {quests.map((q) => (
            <li key={q.id} className="rounded-xl border p-4">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>{CATEGORY_LABEL[q.category] ?? q.category}</span>
                <span>{q.quest_date} · {q.xp_value} XP</span>
              </div>
              <div className="font-semibold">{q.title}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Link from home** — in `app/(app)/home/page.tsx`, add a journal link near the signout form. Add the import `import Link from "next/link";` and, just above the signout `<form>`, add:
```tsx
      <Link href="/journal" className="text-sm underline">
        Журнал виконаних 📜
      </Link>
```

- [ ] **Step 3: Verify build + tests** — `npm run build` succeeds; `npm test` green.

- [ ] **Step 4: Commit**
```bash
git add "app/(app)/journal/page.tsx" "app/(app)/home/page.tsx"
git commit -m "feat: add completed-quests journal page"
```

---

## Task 7: Live verification

- [ ] `npm run dev`, open `/home` while logged in.
- [ ] StatsBar shows Level 1, your current XP, streak 🔥.
- [ ] Complete a quest → confetti fires; reload → XP increased by the quest's value, streak ≥ 1.
- [ ] Open `/journal` → the completed quest is listed.
- [ ] DB check: `xp_ledger` has a row for the quest; `streaks.current_streak ≥ 1`.
- [ ] Completing the same quest again (it's already done — button hidden) does NOT double-award; if you force a second `completeQuest`, no new ledger row appears (idempotency).

---

## Definition of Done (Plan 3)

- [ ] `npm test` passes (levels + streak units).
- [ ] `npm run build` succeeds.
- [ ] Completing a quest awards XP exactly once, updates the streak, and fires confetti.
- [ ] Home shows level/XP/streak; `/journal` lists completed quests.

## Notes for Plan 4 (Push + morning ritual)

- The mood check-in (which feeds generation) gets its UI here; today generation reads `mood_checkins` but nothing writes it yet — Plan 4 adds the morning mood ritual + web push + Vercel cron to generate and notify.
