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
  const totalXp = (ledger ?? []).reduce((sum: number, r: { delta: number }) => sum + r.delta, 0);

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
