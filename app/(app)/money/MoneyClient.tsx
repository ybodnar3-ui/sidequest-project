"use client";

import { useState, useTransition } from "react";
import { addStake, resolveStake } from "./actions";

interface Stake {
  id: string;
  amount: number;
  currency: string;
  outcome: string;
  note: string | null;
}

export function MoneyClient(props: { stakes: Stake[] }) {
  const [amount, setAmount] = useState(5);
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Explainer */}
      <p style={{ fontSize: "0.82rem", color: "var(--sq-muted)", lineHeight: 1.55 }}>
        Облік ставок на виконання (без реальних платежів). Постав суму «на кін» — і чесно познач, виконав чи злив.
      </p>

      {/* Add stake form */}
      <div className="sq-card sq-animate-in sq-delay-1" style={{ padding: "22px 20px" }}>
        <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--sq-text)", marginBottom: 14, letterSpacing: "-0.01em" }}>
          Нова ставка
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="sq-input"
              style={{ width: 100 }}
            />
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              className="sq-input"
              style={{ width: 80, textAlign: "center" }}
            />
          </div>
          <input
            placeholder="На що (необов'язково)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="sq-input"
          />
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await addStake(amount, currency, note); setNote(""); })}
            className="sq-btn sq-btn-primary"
          >
            Поставити
          </button>
        </div>
      </div>

      {/* Stakes list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--sq-text)", letterSpacing: "-0.01em" }}>
          Ставки
        </h2>
        {props.stakes.length === 0 && (
          <p style={{ fontSize: "0.85rem", color: "var(--sq-muted)" }}>Поки немає ставок.</p>
        )}
        {props.stakes.map((s) => (
          <div
            key={s.id}
            className="sq-card"
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 14,
              borderColor: s.outcome === "won"
                ? "rgba(52,211,153,0.25)"
                : s.outcome === "lost"
                ? "rgba(248,113,113,0.25)"
                : "var(--sq-border)",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--sq-text)", marginBottom: 2 }}>
                {s.amount} {s.currency}
              </div>
              {s.note && (
                <div style={{ fontSize: "0.75rem", color: "var(--sq-muted)" }}>{s.note}</div>
              )}
            </div>
            {s.outcome === "open" ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => resolveStake(s.id, "won"))}
                  className="sq-btn"
                  style={{
                    padding: "7px 14px",
                    fontSize: "0.75rem",
                    background: "rgba(52,211,153,0.15)",
                    border: "1px solid rgba(52,211,153,0.35)",
                    color: "var(--sq-success)",
                    borderRadius: 10,
                  }}
                >
                  Виконав
                </button>
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => resolveStake(s.id, "lost"))}
                  className="sq-btn"
                  style={{
                    padding: "7px 14px",
                    fontSize: "0.75rem",
                    background: "rgba(248,113,113,0.12)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    color: "var(--sq-error)",
                    borderRadius: 10,
                  }}
                >
                  Злив
                </button>
              </div>
            ) : (
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: s.outcome === "won" ? "var(--sq-success)" : "var(--sq-error)",
                }}
              >
                {s.outcome === "won" ? "✅ Виконав" : "❌ Злив"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
