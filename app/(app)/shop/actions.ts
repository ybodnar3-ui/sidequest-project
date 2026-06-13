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
