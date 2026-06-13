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
