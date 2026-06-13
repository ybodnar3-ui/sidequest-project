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
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Магазин 🎁</h1>
        <Link href="/home" className="text-sm underline">← Додому</Link>
      </div>
      <ShopClient
        balance={stats.balance}
        rewards={(rewards ?? []) as { id: string; name: string; cost_xp: number }[]}
      />
    </main>
  );
}
