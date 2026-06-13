# SideQuest Phase 2 — Plan 6: Reward Modules (Shop + Money Bank)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two optional, settings-toggled reward modules on top of the XP engine: a **Rewards Shop** (define real-life rewards priced in XP, redeem with your spendable balance) and a **Money Bank** (manual stake ledger). Surface them on `/home` only when enabled.

**Architecture:** XP becomes two numbers: **lifetime XP** (sum of positive ledger deltas → drives level, never decreases) and **spendable balance** (sum of all deltas → currency for the shop). Redeeming a reward inserts a negative `xp_ledger` row (reason `redeem`) + a `redemptions` row, guarded by a balance check. The Money Bank writes plain rows to `money_stakes` (no real payments). `profiles.enabled_reward_modules` (`text[]`, default `['xp']`) gates which modules show; the settings page toggles `shop`/`money`. All tables already exist (`custom_rewards`, `redemptions`, `money_stakes`).

**Tech Stack:** Supabase server client, Next.js server actions, Vitest (balance/level split unit).

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/rewards/stats.ts` | Modify: return `lifetimeXp` (level) + `balance` (spendable) |
| `lib/rewards/stats.test.ts` | New: split logic test |
| `app/(app)/shop/page.tsx` | Rewards shop page |
| `app/(app)/shop/actions.ts` | `addReward`, `redeemReward` |
| `app/(app)/shop/ShopClient.tsx` | Shop UI (add + redeem) |
| `app/(app)/money/page.tsx` | Money bank page |
| `app/(app)/money/actions.ts` | `addStake`, `resolveStake` |
| `app/(app)/money/MoneyClient.tsx` | Money bank UI |
| `app/(app)/settings/SettingsForm.tsx` | Modify: reward-module toggles |
| `app/(app)/settings/actions.ts` | Modify: persist `enabled_reward_modules` |
| `app/(app)/settings/page.tsx` | Modify: pass `enabled_reward_modules` |
| `app/(app)/home/page.tsx` | Modify: conditional Shop/Money links + show balance |
| `app/(app)/home/StatsBar.tsx` | Modify: show spendable balance |

---

## Task 1: Split lifetime XP vs spendable balance (TDD)

The level must come from lifetime earned XP (positive deltas only) so redemptions never lower your level. Extract the pure split so it's testable.

**Files:** Create `lib/rewards/ledger.ts`, `lib/rewards/ledger.test.ts`; modify `lib/rewards/stats.ts`

- [ ] **Step 1: Failing test** — create `lib/rewards/ledger.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { summarizeLedger } from "./ledger";

describe("summarizeLedger", () => {
  it("lifetime = positive deltas; balance = net of all deltas", () => {
    const r = summarizeLedger([{ delta: 15 }, { delta: 10 }, { delta: -20 }]);
    expect(r.lifetimeXp).toBe(25);
    expect(r.balance).toBe(5);
  });
  it("handles empty", () => {
    expect(summarizeLedger([])).toEqual({ lifetimeXp: 0, balance: 0 });
  });
  it("never lets balance below zero math affect lifetime", () => {
    const r = summarizeLedger([{ delta: 10 }, { delta: -10 }]);
    expect(r.lifetimeXp).toBe(10);
    expect(r.balance).toBe(0);
  });
});
```

- [ ] **Step 2: Run, confirm FAIL.**

- [ ] **Step 3: Implement** — create `lib/rewards/ledger.ts`:
```ts
export function summarizeLedger(rows: { delta: number }[]): {
  lifetimeXp: number;
  balance: number;
} {
  let lifetimeXp = 0;
  let balance = 0;
  for (const r of rows) {
    balance += r.delta;
    if (r.delta > 0) lifetimeXp += r.delta;
  }
  return { lifetimeXp, balance };
}
```

- [ ] **Step 4: Run, confirm PASS.**

- [ ] **Step 5: Update `lib/rewards/stats.ts`** to use it. Replace the `totalXp` computation and the returned object. The new `RewardStats` adds `balance`; `level`/`fraction` now use `lifetimeXp`:
```ts
import { createClient } from "@/lib/supabase/server";
import { levelProgress } from "./levels";
import { summarizeLedger } from "./ledger";

export interface RewardStats {
  lifetimeXp: number;
  balance: number;
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
  const { lifetimeXp, balance } = summarizeLedger(
    (ledger ?? []) as { delta: number }[],
  );

  const { data: streak } = await supabase
    .from("streaks")
    .select("current_streak, best_streak")
    .eq("user_id", userId)
    .maybeSingle();

  const p = levelProgress(lifetimeXp);
  return {
    lifetimeXp,
    balance,
    level: p.level,
    fraction: p.fraction,
    intoLevel: p.intoLevel,
    span: p.span,
    currentStreak: streak?.current_streak ?? 0,
    bestStreak: streak?.best_streak ?? 0,
  };
}
```

- [ ] **Step 6: Update `StatsBar.tsx`** to accept `totalXp`-equivalent rename. Change its props/usage: replace `totalXp` with `lifetimeXp` and add a `balance` line. In `app/(app)/home/StatsBar.tsx`, change the props type field `totalXp: number;` to `lifetimeXp: number; balance: number;`, render `{props.lifetimeXp} XP` where it currently shows `{props.totalXp} XP`, and add below the bar:
```tsx
      <div className="mt-1 text-xs text-gray-500">Баланс: {props.balance} XP</div>
```

- [ ] **Step 7: Update `app/(app)/home/page.tsx`** StatsBar usage: replace `totalXp={stats.totalXp}` with `lifetimeXp={stats.lifetimeXp} balance={stats.balance}`.

- [ ] **Step 8: Verify build + tests** — `npm run build` + `npm test` green.

- [ ] **Step 9: Commit**
```bash
git add lib/rewards/ledger.ts lib/rewards/ledger.test.ts lib/rewards/stats.ts "app/(app)/home/StatsBar.tsx" "app/(app)/home/page.tsx"
git commit -m "feat: split lifetime XP (level) from spendable balance"
```

---

## Task 2: Settings — reward-module toggles

**Files:** modify `app/(app)/settings/actions.ts`, `SettingsForm.tsx`, `settings/page.tsx`

- [ ] **Step 1: actions.ts** — extend `SettingsInput` and the update. Add `enabled_reward_modules: string[];` to the interface, and in `saveSettings` compute:
```ts
  const modules = ["shop", "money"].filter((m) => input.enabled_reward_modules.includes(m));
```
and add to the `.update({...})` object: `enabled_reward_modules: ["xp", ...modules],` (xp is always on).

- [ ] **Step 2: SettingsForm.tsx** — add module toggles. Add to `SettingsInput`-driven state:
```tsx
  const [modules, setModules] = useState<string[]>(props.initial.enabled_reward_modules);
```
Add a section before the Save button:
```tsx
      <section>
        <h2 className="mb-2 font-semibold">Модулі нагород</h2>
        {[
          { key: "shop", label: "🎁 Магазин реальних нагород" },
          { key: "money", label: "💰 Грошовий банк" },
        ].map((m) => (
          <label key={m.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={modules.includes(m.key)}
              onChange={() => {
                setSaved(false);
                setModules((prev) =>
                  prev.includes(m.key) ? prev.filter((x) => x !== m.key) : [...prev, m.key],
                );
              }}
            />
            {m.label}
          </label>
        ))}
      </section>
```
Include `enabled_reward_modules: modules` in the `saveSettings({...})` call inside `save()`.

- [ ] **Step 3: settings/page.tsx** — pass `enabled_reward_modules` into `initial`:
select it from profiles (`enabled_reward_modules`) and add `enabled_reward_modules: p?.enabled_reward_modules ?? ["xp"],` to the `initial` object.

- [ ] **Step 4: Verify build** — `npm run build`.

- [ ] **Step 5: Commit**
```bash
git add "app/(app)/settings/actions.ts" "app/(app)/settings/SettingsForm.tsx" "app/(app)/settings/page.tsx"
git commit -m "feat: add reward-module toggles to settings"
```

---

## Task 3: Rewards Shop

**Files:** Create `app/(app)/shop/actions.ts`, `app/(app)/shop/ShopClient.tsx`, `app/(app)/shop/page.tsx`

- [ ] **Step 1: actions.ts**
```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { summarizeLedger } from "@/lib/rewards/ledger";

export async function addReward(name: string, costXp: number): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const cost = Math.max(1, Math.round(costXp));
  if (!name.trim()) return;
  await supabase.from("custom_rewards").insert({ user_id: user.id, name: name.trim(), cost_xp: cost });
  revalidatePath("/shop");
}

export async function redeemReward(rewardId: string): Promise<{ ok: boolean; reason?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: reward } = await supabase
    .from("custom_rewards")
    .select("id, name, cost_xp")
    .eq("id", rewardId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!reward) return { ok: false, reason: "not_found" };

  const { data: ledger } = await supabase.from("xp_ledger").select("delta").eq("user_id", user.id);
  const { balance } = summarizeLedger((ledger ?? []) as { delta: number }[]);
  if (balance < reward.cost_xp) return { ok: false, reason: "insufficient" };

  await supabase.from("xp_ledger").insert({
    user_id: user.id,
    delta: -reward.cost_xp,
    reason: "redeem",
  });
  await supabase.from("redemptions").insert({
    user_id: user.id,
    reward_id: reward.id,
    cost_xp: reward.cost_xp,
  });
  revalidatePath("/shop");
  revalidatePath("/home");
  return { ok: true };
}
```

- [ ] **Step 2: ShopClient.tsx**
```tsx
"use client";

import { useState, useTransition } from "react";
import { addReward, redeemReward } from "./actions";

export function ShopClient(props: {
  balance: number;
  rewards: { id: string; name: string; cost_xp: number }[];
}) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState(50);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <p className="text-sm">Баланс: <b>{props.balance} XP</b></p>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Додати нагороду</h2>
        <div className="flex flex-col gap-2">
          <input
            placeholder="Напр. морозиво, серія серіалу…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border p-2 text-sm"
          />
          <label className="flex items-center justify-between text-sm">
            Ціна в XP
            <input type="number" min={1} value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-20 rounded-lg border p-1 text-center" />
          </label>
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await addReward(name, cost); setName(""); })}
            className="rounded-lg bg-black p-2 text-sm text-white disabled:opacity-50"
          >
            Додати
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Нагороди</h2>
        {props.rewards.length === 0 && <p className="text-sm text-gray-500">Поки порожньо — додай першу 🎁</p>}
        {props.rewards.map((r) => {
          const affordable = props.balance >= r.cost_xp;
          return (
            <div key={r.id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-500">{r.cost_xp} XP</div>
              </div>
              <button
                disabled={pending || !affordable}
                onClick={() =>
                  startTransition(async () => {
                    const res = await redeemReward(r.id);
                    setMsg(res.ok ? `Куплено: ${r.name} 🎉` : res.reason === "insufficient" ? "Замало XP" : "Помилка");
                  })
                }
                className="rounded-lg bg-black px-3 py-1 text-sm text-white disabled:opacity-40"
              >
                {affordable ? "Купити" : "Замало"}
              </button>
            </div>
          );
        })}
      </section>
      {msg && <p className="text-center text-sm text-green-600">{msg}</p>}
    </div>
  );
}
```

- [ ] **Step 3: page.tsx**
```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getRewardStats } from "@/lib/rewards/stats";
import { ShopClient } from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stats = await getRewardStats(user.id);
  const { data: rewards } = await supabase
    .from("custom_rewards")
    .select("id, name, cost_xp")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Магазин 🎁</h1>
        <Link href="/home" className="text-sm underline">← Додому</Link>
      </div>
      <ShopClient
        balance={stats.balance}
        rewards={(rewards ?? []) as { id: string; name: string; cost_xp: number }[]}
      />
    </main>
  );
}
```

- [ ] **Step 4: Verify build** — `npm run build`.

- [ ] **Step 5: Commit**
```bash
git add "app/(app)/shop"
git commit -m "feat: add rewards shop (define rewards, redeem with XP balance)"
```

---

## Task 4: Money Bank

**Files:** Create `app/(app)/money/actions.ts`, `app/(app)/money/MoneyClient.tsx`, `app/(app)/money/page.tsx`

- [ ] **Step 1: actions.ts**
```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addStake(amount: number, currency: string, note: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const amt = Math.round(amount * 100) / 100;
  if (!(amt > 0)) return;
  await supabase.from("money_stakes").insert({
    user_id: user.id,
    amount: amt,
    currency: currency || "USD",
    note: note.trim() || null,
  });
  revalidatePath("/money");
}

export async function resolveStake(id: string, outcome: "won" | "lost"): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase
    .from("money_stakes")
    .update({ outcome })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/money");
}
```

- [ ] **Step 2: MoneyClient.tsx**
```tsx
"use client";

import { useState, useTransition } from "react";
import { addStake, resolveStake } from "./actions";

interface Stake {
  id: string;
  amount: number;
  currency: string;
  outcome: string;
  note: string | null;
}

export function MoneyClient(props: { stakes: Stake[] }) {
  const [amount, setAmount] = useState(5);
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <p className="text-xs text-gray-500">
        Облік ставок на виконання (без реальних платежів). Постав суму «на кін» — і чесно
        познач, виконав чи злив.
      </p>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Нова ставка</h2>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-24 rounded-lg border p-2 text-sm" />
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className="w-20 rounded-lg border p-2 text-center text-sm" />
          </div>
          <input placeholder="На що (необов'язково)" value={note} onChange={(e) => setNote(e.target.value)} className="rounded-lg border p-2 text-sm" />
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await addStake(amount, currency, note); setNote(""); })}
            className="rounded-lg bg-black p-2 text-sm text-white disabled:opacity-50"
          >
            Поставити
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Ставки</h2>
        {props.stakes.length === 0 && <p className="text-sm text-gray-500">Поки немає ставок.</p>}
        {props.stakes.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="font-medium">{s.amount} {s.currency}</div>
              {s.note && <div className="text-xs text-gray-500">{s.note}</div>}
            </div>
            {s.outcome === "open" ? (
              <div className="flex gap-2">
                <button disabled={pending} onClick={() => startTransition(() => resolveStake(s.id, "won"))} className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50">Виконав</button>
                <button disabled={pending} onClick={() => startTransition(() => resolveStake(s.id, "lost"))} className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50">Злив</button>
              </div>
            ) : (
              <span className={`text-sm font-semibold ${s.outcome === "won" ? "text-green-600" : "text-red-600"}`}>
                {s.outcome === "won" ? "✅ Виконав" : "❌ Злив"}
              </span>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: page.tsx**
```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MoneyClient } from "./MoneyClient";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: stakes } = await supabase
    .from("money_stakes")
    .select("id, amount, currency, outcome, note")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Грошовий банк 💰</h1>
        <Link href="/home" className="text-sm underline">← Додому</Link>
      </div>
      <MoneyClient stakes={(stakes ?? []) as { id: string; amount: number; currency: string; outcome: string; note: string | null }[]} />
    </main>
  );
}
```

- [ ] **Step 4: Verify build** — `npm run build`.

- [ ] **Step 5: Commit**
```bash
git add "app/(app)/money"
git commit -m "feat: add money bank stake ledger"
```

---

## Task 5: Conditional links on home

**Files:** modify `app/(app)/home/page.tsx`

- [ ] **Step 1:** Load the profile's `enabled_reward_modules` (the page already loads the profile timezone — extend that select to include `enabled_reward_modules`, or add a small select). Then render the links conditionally near the journal/settings links:
```tsx
      {(modules ?? []).includes("shop") && (
        <Link href="/shop" className="text-sm underline">Магазин нагород 🎁</Link>
      )}
      {(modules ?? []).includes("money") && (
        <Link href="/money" className="text-sm underline">Грошовий банк 💰</Link>
      )}
```
where `modules` is read from the profile. Implementation detail: add to an existing profile query in page.tsx `enabled_reward_modules`, e.g.:
```tsx
  const { data: prof } = await supabase
    .from("profiles")
    .select("time_zone, enabled_reward_modules")
    .eq("id", user.id)
    .single();
  const modules = prof?.enabled_reward_modules ?? ["xp"];
```
(Consolidate with the existing timezone read if present — avoid two separate profile queries.)

- [ ] **Step 2: Verify build + tests** — `npm run build` + `npm test` green.

- [ ] **Step 3: Commit**
```bash
git add "app/(app)/home/page.tsx"
git commit -m "feat: show shop/money links on home when modules enabled"
```

---

## Task 6: Live verification

- [ ] Settings → enable "🎁 Магазин" and "💰 Грошовий банк" → Save. Home now shows both links.
- [ ] Shop: add a reward ("Морозиво", 20 XP). With ≥20 balance, "Купити" works → balance drops by 20, a `redemptions` row + negative `xp_ledger` row appear, and your **level is unchanged**.
- [ ] Try redeeming with insufficient balance → button shows "Замало" / action returns insufficient.
- [ ] Money: add a stake ($5), mark "Виконав" → shows ✅; add another, "Злив" → ❌. Rows in `money_stakes` reflect outcomes.
- [ ] Disable a module in settings → its link disappears from home.

## Definition of Done (Plan 6 / Phase 2)

- [ ] `npm test` passes (ledger split units).
- [ ] `npm run build` succeeds.
- [ ] Spending XP reduces balance but never the level.
- [ ] Shop + Money Bank work and are gated by settings toggles.

## Notes for Phase 3

- Multi-user onboarding, custom-domain email (Resend), Stripe subscriptions, per-hour/popup push (Vercel Pro hourly cron), and quest "proof" enforcement.
