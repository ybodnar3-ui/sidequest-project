"use client";

import { useTransition } from "react";
import { saveMood } from "./actions";

const MOODS: { key: string; emoji: string; label: string }[] = [
  { key: "great", emoji: "😄", label: "Чудово" },
  { key: "good",  emoji: "🙂", label: "Добре" },
  { key: "meh",   emoji: "😐", label: "Так собі" },
  { key: "low",   emoji: "😔", label: "Кисло" },
];

export function MoodCheckin({ current }: { current: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="sq-card sq-animate-in sq-delay-2"
      style={{ width: "100%", maxWidth: 480, padding: "18px 20px" }}
    >
      <p
        style={{
          fontFamily: "'Unbounded', sans-serif",
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--sq-accent2)",
          marginBottom: 14,
        }}
      >
        Як настрій сьогодні?
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        {MOODS.map((m) => {
          const active = current === m.key;
          return (
            <button
              key={m.key}
              disabled={pending}
              onClick={() => startTransition(() => saveMood(m.key))}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                padding: "10px 4px",
                borderRadius: 12,
                border: `1px solid ${active ? "var(--sq-accent)" : "var(--sq-border)"}`,
                background: active
                  ? "rgba(109,94,250,0.15)"
                  : "rgba(255,255,255,0.02)",
                color: active ? "var(--sq-text)" : "var(--sq-muted)",
                fontSize: "0.72rem",
                fontFamily: "'PT Sans', sans-serif",
                cursor: "pointer",
                transition: "all 0.2s ease",
                opacity: pending ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{m.emoji}</span>
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
