import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrCreateTodaysQuest } from "@/lib/quests/today";
import { QuestCard } from "./QuestCard";
import { LocationSetup } from "./LocationSetup";
import { getRewardStats } from "@/lib/rewards/stats";
import { StatsBar } from "./StatsBar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { quest, needsLocation } = await getOrCreateTodaysQuest(user.id);
  const stats = await getRewardStats(user.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Квест дня 🎲</h1>
      <StatsBar
        level={stats.level}
        totalXp={stats.totalXp}
        fraction={stats.fraction}
        intoLevel={stats.intoLevel}
        span={stats.span}
        currentStreak={stats.currentStreak}
      />
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
      <Link href="/journal" className="text-sm underline">Журнал виконаних 📜</Link>
      <form action="/auth/signout" method="post">
        <button className="rounded-lg border px-4 py-2 text-sm" type="submit">Вийти</button>
      </form>
    </main>
  );
}
