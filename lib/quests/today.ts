import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuestDateKey } from "@/lib/dates";
import { getWeather } from "@/lib/weather/openMeteo";
import { generateQuest } from "./generate";
import { QUEST_CATEGORIES, type QuestCategory } from "./schema";

export interface TodaysQuestResult {
  quest: {
    id: string;
    title: string;
    description: string;
    category: string;
    est_minutes: number;
    xp_value: number;
    status: string;
  } | null;
  needsLocation: boolean;
}

export async function getOrCreateTodaysQuest(userId: string): Promise<TodaysQuestResult> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("time_zone, enabled_categories, current_city, current_lat, current_lon")
    .eq("id", userId)
    .single();

  const timeZone = profile?.time_zone ?? "UTC";
  const today = getQuestDateKey(new Date(), timeZone);

  // Read today's morning quest. order+limit(1) keeps this safe even if legacy
  // duplicates exist; the unique (user_id, quest_date, source) constraint
  // prevents new ones.
  async function readToday() {
    const { data } = await supabase
      .from("quests")
      .select("id, title, description, category, est_minutes, xp_value, status")
      .eq("user_id", userId)
      .eq("quest_date", today)
      .eq("source", "morning")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data;
  }

  const existing = await readToday();
  if (existing) return { quest: existing, needsLocation: false };

  if (profile?.current_lat == null || profile?.current_lon == null) {
    return { quest: null, needsLocation: true };
  }

  const weather = await getWeather(profile.current_lat, profile.current_lon);
  const { data: mood } = await supabase
    .from("mood_checkins")
    .select("mood")
    .eq("user_id", userId)
    .eq("checkin_date", today)
    .maybeSingle();
  const { data: recent } = await supabase
    .from("quests")
    .select("title")
    .eq("user_id", userId)
    .order("quest_date", { ascending: false })
    .limit(10);

  const enabled = (profile?.enabled_categories ?? QUEST_CATEGORIES).filter(
    (c: string): c is QuestCategory => (QUEST_CATEGORIES as readonly string[]).includes(c),
  );

  const generated = await generateQuest({
    city: profile?.current_city ?? null,
    weather,
    mood: mood?.mood ?? null,
    categories: enabled.length ? enabled : [...QUEST_CATEGORIES],
    recentTitles: (recent ?? []).map((r: { title: string }) => r.title),
  });

  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from("quests")
    .insert({
      user_id: userId,
      quest_date: today,
      source: "morning",
      title: generated.title,
      description: generated.description,
      category: generated.category,
      est_minutes: generated.est_minutes,
      xp_value: generated.xp_value,
    })
    .select("id, title, description, category, est_minutes, xp_value, status")
    .single();

  if (error) {
    // A concurrent request likely won the race and inserted first, tripping the
    // unique (user_id, quest_date, source) constraint. Return the winner instead
    // of erroring — this is what stops "answering mood regenerates the quest".
    const winner = await readToday();
    if (winner) return { quest: winner, needsLocation: false };
    throw error;
  }
  return { quest: inserted, needsLocation: false };
}
