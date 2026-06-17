import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getRewardStats } from "@/lib/rewards/stats";
import { ShopClient } from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stats = await getRewardStats(user.id);
  const { data: rewards } = await supabase
    .from("custom_rewards")
    .select("id, name, cost_xp")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

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
        <h1 className="sq-heading" style={{ fontSize: "1.3rem" }}>Магазин 🎁</h1>
        <Link href="/home" className="sq-back">← Додому</Link>
      </div>

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 2 }}>
        <ShopClient
          balance={stats.balance}
          rewards={(rewards ?? []) as { id: string; name: string; cost_xp: number }[]}
        />
      </div>
    </main>
  );
}
