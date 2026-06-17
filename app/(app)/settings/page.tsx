import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SettingsForm } from "./SettingsForm";
import { QUEST_CATEGORIES } from "@/lib/quests/schema";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: p } = await supabase
    .from("profiles")
    .select("enabled_categories, time_zone, rhythm_mode, quests_per_day, morning_push_hour, enabled_reward_modules")
    .eq("id", user.id)
    .single();

  return (
    <main className="sq-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 48px", gap: 20, position: "relative" }}>
      {/* Ambient orbs */}
      <div className="sq-orb sq-page-orb-1" aria-hidden />
      <div className="sq-orb sq-page-orb-2" aria-hidden />

      {/* Header */}
      <div
        className="sq-animate-in"
        style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}
      >
        <h1 className="sq-heading" style={{ fontSize: "1.3rem" }}>Налаштування ⚙️</h1>
        <Link href="/home" className="sq-back">← Додому</Link>
      </div>

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 2 }}>
        <SettingsForm
          initial={{
            enabled_categories: p?.enabled_categories ?? [...QUEST_CATEGORIES],
            time_zone: p?.time_zone ?? "UTC",
            rhythm_mode: (p?.rhythm_mode ?? "morning") as "morning" | "popup" | "both",
            quests_per_day: p?.quests_per_day ?? 1,
            morning_push_hour: p?.morning_push_hour ?? 8,
            enabled_reward_modules: p?.enabled_reward_modules ?? ["xp"],
          }}
        />
      </div>
    </main>
  );
}
