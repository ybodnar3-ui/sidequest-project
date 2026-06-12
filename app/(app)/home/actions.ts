"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeQuest(questId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("quests")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", questId)
    .eq("user_id", user.id);

  revalidatePath("/home");
}

export async function saveLocation(city: string, lat: number, lon: number): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ current_city: city, current_lat: lat, current_lon: lon })
    .eq("id", user.id);

  revalidatePath("/home");
}
