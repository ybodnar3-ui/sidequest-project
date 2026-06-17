"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addStake(amount: number, currency: string, note: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const amt = Math.round(amount * 100) / 100;
  if (!(amt > 0)) return;
  // Sanitize currency to a 3-letter code; cap note length.
  const cur = (currency || "USD").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "USD";
  await supabase.from("money_stakes").insert({
    user_id: user.id,
    amount: amt,
    currency: cur,
    note: note.trim().slice(0, 200) || null,
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
