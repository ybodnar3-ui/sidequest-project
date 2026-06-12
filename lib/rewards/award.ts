import { computeStreak } from "./streak";

type SupabaseClientLike = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

/**
 * Awards XP and updates the streak for a quest that JUST transitioned to done.
 * Call ONLY after a confirmed pending→done transition (so it runs once).
 */
export async function awardForQuest(
  supabase: SupabaseClientLike,
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
