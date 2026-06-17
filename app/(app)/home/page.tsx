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

  const { data: ob } = await supabase.from("profiles").select("onboarded_at").eq("id", user.id).single();
  if (!ob?.onboarded_at) redirect("/onboarding");

  const { quest, needsLocation } = await getOrCreateTodaysQuest(user.id);
  const stats = await getRewardStats(user.id);

  const { data: profileTz } = await supabase
    .from("profiles")
    .select("time_zone, enabled_reward_modules")
    .eq("id", user.id)
    .single();
  const modules = profileTz?.enabled_reward_modules ?? ["xp"];
  const todayKey = getQuestDateKey(new Date(), profileTz?.time_zone ?? "UTC");
  const { data: moodRow } = await supabase
    .from("mood_checkins")
    .select("mood")
    .eq("user_id", user.id)
    .eq("checkin_date", todayKey)
    .maybeSingle();

  return (
    <main className="sq-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 48px", gap: 16, position: "relative" }}>
      {/* Ambient orbs */}
      <div className="sq-orb sq-page-orb-1" aria-hidden />
      <div className="sq-orb sq-page-orb-2" aria-hidden />

      {/* Header */}
      <div
        className="sq-animate-in"
        style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, position: "relative", zIndex: 2 }}
      >
        <h1 className="sq-heading" style={{ fontSize: "1.3rem" }}>Квест дня 🎲</h1>
        <form action="/auth/signout" method="post">
          <button
            className="sq-btn sq-btn-secondary"
            type="submit"
            style={{ padding: "7px 16px", fontSize: "0.72rem" }}
          >
            Вийти
          </button>
        </form>
      </div>

      {/* Content — all constrained and z-indexed above orbs */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 2 }}>
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
          <div className="sq-card" style={{ padding: "20px 24px", textAlign: "center" }}>
            <p style={{ color: "var(--sq-muted)" }}>Не вдалося згенерувати квест. Онови сторінку.</p>
          </div>
        )}

        <PushSetup />

        {/* Nav links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <hr className="sq-divider" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", paddingTop: 4 }}>
            <Link href="/journal" className="sq-btn sq-btn-secondary" style={{ padding: "9px 20px", fontSize: "0.78rem" }}>
              Журнал 📜
            </Link>
            <Link href="/settings" className="sq-btn sq-btn-secondary" style={{ padding: "9px 20px", fontSize: "0.78rem" }}>
              Налаштування ⚙️
            </Link>
            {modules.includes("shop") && (
              <Link href="/shop" className="sq-btn sq-btn-secondary" style={{ padding: "9px 20px", fontSize: "0.78rem" }}>
                Магазин 🎁
              </Link>
            )}
            {modules.includes("money") && (
              <Link href="/money" className="sq-btn sq-btn-secondary" style={{ padding: "9px 20px", fontSize: "0.78rem" }}>
                Банк 💰
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
