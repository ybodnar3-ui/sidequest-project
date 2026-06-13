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
    .select("enabled_categories, time_zone, rhythm_mode, quests_per_day, morning_push_hour")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Налаштування ⚙️</h1>
        <Link href="/home" className="text-sm underline">← Додому</Link>
      </div>
      <SettingsForm
        initial={{
          enabled_categories: p?.enabled_categories ?? [...QUEST_CATEGORIES],
          time_zone: p?.time_zone ?? "UTC",
          rhythm_mode: (p?.rhythm_mode ?? "morning") as "morning" | "popup" | "both",
          quests_per_day: p?.quests_per_day ?? 1,
          morning_push_hour: p?.morning_push_hour ?? 8,
        }}
      />
    </main>
  );
}
