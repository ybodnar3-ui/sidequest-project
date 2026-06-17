"use client";

import { useTransition } from "react";
import { completeQuest } from "./actions";
import confetti from "canvas-confetti";

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

export function QuestCard(props: {
  id: string;
  title: string;
  description: string;
  category: string;
  estMinutes: number;
  xpValue: number;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const done = props.status === "done";
  const accent = CATEGORY_COLOR[props.category] ?? "var(--sq-accent2)";

  return (
    <div
      className="sq-card sq-animate-in sq-delay-2"
      style={{
        width: "100%",
        maxWidth: 480,
        padding: "28px 24px",
        background: done
          ? "rgba(52,211,153,0.05)"
          : "linear-gradient(145deg, rgba(109,94,250,0.08) 0%, rgba(255,255,255,0.03) 100%)",
        borderColor: done ? "rgba(52,211,153,0.25)" : "rgba(120,100,255,0.22)",
      }}
    >
      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "'Unbounded', sans-serif",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: accent,
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
            borderRadius: 100,
            padding: "3px 10px",
          }}
        >
          {CATEGORY_LABEL[props.category] ?? props.category}
        </span>
        <span style={{ fontSize: "0.78rem", color: "var(--sq-muted)", display: "flex", gap: 8 }}>
          <span>~{props.estMinutes} хв</span>
          <span style={{ color: "var(--sq-accent2)", fontWeight: 700 }}>+{props.xpValue} XP</span>
        </span>
      </div>

      {/* Title */}
      <h2
        className="sq-heading"
        style={{ fontSize: "1.15rem", marginBottom: 10, color: "var(--sq-text)" }}
      >
        {props.title}
      </h2>

      {/* Description */}
      <p style={{ fontSize: "0.88rem", color: "var(--sq-muted2)", lineHeight: 1.6, marginBottom: 22 }}>
        {props.description}
      </p>

      {/* Action */}
      {done ? (
        <div
          style={{
            textAlign: "center",
            padding: "12px",
            borderRadius: 12,
            background: "rgba(52,211,153,0.1)",
            border: "1px solid rgba(52,211,153,0.25)",
            color: "var(--sq-success)",
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 700,
            fontSize: "0.85rem",
            letterSpacing: "0.05em",
          }}
        >
          ✅ Виконано!
        </div>
      ) : (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await completeQuest(props.id);
              confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } });
            })
          }
          className="sq-btn sq-btn-primary"
          style={{ width: "100%" }}
        >
          {pending ? "Зберігаю…" : "Виконати ✅"}
        </button>
      )}
    </div>
  );
}
