"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  // Atomic + race-safe: the redeem_reward DB function checks balance, debits XP,
  // and records the redemption in one transaction (serialized per user), so
  // concurrent redeems can't overdraw or double-spend.
  const { data, error } = await supabase.rpc("redeem_reward", { p_reward_id: rewardId });
  if (error) return { ok: false, reason: "error" };

  const result = data as string;
  if (result === "ok") {
    revalidatePath("/shop");
    revalidatePath("/home");
    return { ok: true };
  }
  return { ok: false, reason: result };
}
