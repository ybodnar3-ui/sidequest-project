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
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Грошовий банк 💰</h1>
        <Link href="/home" className="text-sm underline">← Додому</Link>
      </div>
      <MoneyClient stakes={(stakes ?? []) as { id: string; amount: number; currency: string; outcome: string; note: string | null }[]} />
    </main>
  );
}
