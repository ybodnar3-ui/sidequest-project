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
