import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  social: "Соціальний",
  body: "Тіло",
  creative: "Творчість",
  adventure: "Пригода",
};

export default async function JournalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quests } = await supabase
    .from("quests")
    .select("id, title, category, xp_value, quest_date, status, completed_at")
    .eq("user_id", user.id)
    .eq("status", "done")
    .order("completed_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Журнал 📜</h1>
        <Link href="/home" className="text-sm underline">← Додому</Link>
      </div>
      {!quests || quests.length === 0 ? (
        <p className="text-gray-500">Ще немає виконаних квестів. Уперед! 🎲</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {quests.map((q: { id: string; title: string; category: string; xp_value: number; quest_date: string }) => (
            <li key={q.id} className="rounded-xl border p-4">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>{CATEGORY_LABEL[q.category] ?? q.category}</span>
                <span>{q.quest_date} · {q.xp_value} XP</span>
              </div>
              <div className="font-semibold">{q.title}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
