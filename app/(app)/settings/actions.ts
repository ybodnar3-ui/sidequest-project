"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { QUEST_CATEGORIES } from "@/lib/quests/schema";

export interface SettingsInput {
  enabled_categories: string[];
  time_zone: string;
  rhythm_mode: "morning" | "popup" | "both";
  quests_per_day: number;
  morning_push_hour: number;
  enabled_reward_modules: string[];
}

export async function saveSettings(input: SettingsInput): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const categories = input.enabled_categories.filter((c) =>
    (QUEST_CATEGORIES as readonly string[]).includes(c),
  );
  const rhythm = ["morning", "popup", "both"].includes(input.rhythm_mode)
    ? input.rhythm_mode
    : "morning";
  const perDay = Math.min(5, Math.max(1, Math.round(input.quests_per_day)));
  const hour = Math.min(23, Math.max(0, Math.round(input.morning_push_hour)));
  const modules = ["shop", "money"].filter((m) => input.enabled_reward_modules.includes(m));

  // Validate the IANA time zone — an invalid string would throw in
  // getQuestDateKey (Intl.DateTimeFormat) and break the home page.
  let timeZone = "UTC";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: input.time_zone });
    timeZone = input.time_zone;
  } catch {
    timeZone = "UTC";
  }

  await supabase
    .from("profiles")
    .update({
      enabled_categories: categories.length ? categories : [...QUEST_CATEGORIES],
      time_zone: timeZone,
      rhythm_mode: rhythm,
      quests_per_day: perDay,
      morning_push_hour: hour,
      enabled_reward_modules: ["xp", ...modules],
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/home");
}
