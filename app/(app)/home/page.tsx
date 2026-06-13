import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrCreateTodaysQuest } from "@/lib/quests/today";
import { QuestCard } from "./QuestCard";
import { LocationSetup } from "./LocationSetup";
import { getRewardStats } from "@/lib/rewards/stats";
import { StatsBar } from "./StatsBar";
import { PushSetup } from "./PushSetup";
import { MoodCheckin } from "./MoodCheckin";
import { getQuestDateKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { quest, needsLocation } = await getOrCreateTodaysQuest(user.id);
  const stats = await getRewardStats(user.id);

  const { data: profileTz } = await supabase
    .from("profiles")
    .select("time_zone")
    .eq("id", user.id)
    .single();
  const todayKey = getQuestDateKey(new Date(), profileTz?.time_zone ?? "UTC");
  const { data: moodRow } = await supabase
    .from("mood_checkins")
    .select("mood")
    .eq("user_id", user.id)
    .eq("checkin_date", todayKey)
    .maybeSingle();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Квест дня 🎲</h1>
      <StatsBar
        level={stats.level}
        lifetimeXp={stats.lifetimeXp}
        balance={stats.balance}
        fraction={stats.fraction}
        intoLevel={stats.intoLevel}
        span={stats.span}
        currentStreak={stats.currentStreak}
      />
      <MoodCheckin current={moodRow?.mood ?? null} />
      {needsLocation ? (
        <LocationSetup />
      ) : quest ? (
        <QuestCard
          id={quest.id}
          title={quest.title}
          description={quest.description}
          category={quest.category}
          estMinutes={quest.est_minutes}
          xpValue={quest.xp_value}
          status={quest.status}
        />
      ) : (
        <p className="text-gray-600">Не вдалося згенерувати квест. Онови сторінку.</p>
      )}
      <PushSetup />
      <Link href="/journal" className="text-sm underline">Журнал виконаних 📜</Link>
      <Link href="/settings" className="text-sm underline">Налаштування ⚙️</Link>
      <form action="/auth/signout" method="post">
        <button className="rounded-lg border px-4 py-2 text-sm" type="submit">Вийти</button>
      </form>
    </main>
  );
}
