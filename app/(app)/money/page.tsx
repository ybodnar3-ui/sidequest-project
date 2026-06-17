import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MoneyClient } from "./MoneyClient";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: stakes } = await supabase
    .from("money_stakes")
    .select("id, amount, currency, outcome, note")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
        <h1 className="sq-heading" style={{ fontSize: "1.3rem" }}>Грошовий банк 💰</h1>
        <Link href="/home" className="sq-back">← Додому</Link>
      </div>

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 2 }}>
        <MoneyClient stakes={(stakes ?? []) as { id: string; amount: number; currency: string; outcome: string; note: string | null }[]} />
      </div>
    </main>
  );
}
