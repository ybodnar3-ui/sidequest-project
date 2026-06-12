"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getQuestDateKey } from "@/lib/dates";
import { awardForQuest } from "@/lib/rewards/award";

export async function completeQuest(questId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

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

export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      { onConflict: "endpoint" },
    );
}
