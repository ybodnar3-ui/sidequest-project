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

const CATEGORY_COLOR: Record<string, string> = {
  social:    "#a78bfa",
  body:      "#34d399",
  creative:  "#fbbf24",
  adventure: "#60a5fa",
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
    <main className="sq-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 48px", gap: 20, position: "relative" }}>
      {/* Ambient orbs */}
      <div className="sq-orb sq-page-orb-1" aria-hidden />
      <div className="sq-orb sq-page-orb-2" aria-hidden />

      {/* Header */}
      <div
        className="sq-animate-in"
        style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2 }}
      >
        <h1 className="sq-heading" style={{ fontSize: "1.3rem" }}>Журнал 📜</h1>
        <Link href="/home" className="sq-back">← Додому</Link>
      </div>

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 2 }}>
        {!quests || quests.length === 0 ? (
          <div className="sq-card" style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>🎲</div>
            <p style={{ color: "var(--sq-muted)" }}>Ще немає виконаних квестів. Уперед!</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {quests.map((q: { id: string; title: string; category: string; xp_value: number; quest_date: string }, idx: number) => {
              const accent = CATEGORY_COLOR[q.category] ?? "var(--sq-accent2)";
              return (
                <li
                  key={q.id}
                  className="sq-card sq-animate-in"
                  style={{
                    padding: "16px 18px",
                    borderRadius: 14,
                    animationDelay: `${0.05 + idx * 0.04}s`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span
                      style={{
                        fontFamily: "'Unbounded', sans-serif",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: accent,
                        background: `${accent}18`,
                        border: `1px solid ${accent}30`,
                        borderRadius: 100,
                        padding: "2px 8px",
                      }}
                    >
                      {CATEGORY_LABEL[q.category] ?? q.category}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--sq-muted)", display: "flex", gap: 8 }}>
                      <span>{q.quest_date}</span>
                      <span style={{ color: "var(--sq-accent2)", fontWeight: 700 }}>+{q.xp_value} XP</span>
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--sq-text)" }}>{q.title}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
