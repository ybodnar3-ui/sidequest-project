"use client";

import { useState, useTransition } from "react";
import { addReward, redeemReward } from "./actions";

export function ShopClient(props: {
  balance: number;
  rewards: { id: string; name: string; cost_xp: number }[];
}) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState(50);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Balance pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 18px",
          borderRadius: 100,
          background: "rgba(109,94,250,0.12)",
          border: "1px solid rgba(120,100,255,0.22)",
          alignSelf: "flex-start",
        }}
      >
        <span style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sq-accent2)" }}>Баланс</span>
        <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: "1rem", color: "var(--sq-text)" }}>{props.balance} XP</span>
      </div>

      {/* Add reward form */}
      <div className="sq-card sq-animate-in sq-delay-1" style={{ padding: "22px 20px" }}>
        <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--sq-text)", marginBottom: 14, letterSpacing: "-0.01em" }}>
          Додати нагороду
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="Напр. морозиво, серія серіалу…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sq-input"
          />
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--sq-muted2)" }}>
            Ціна в XP
            <input
              type="number"
              min={1}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="sq-input"
              style={{ width: 80, textAlign: "center" }}
            />
          </label>
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await addReward(name, cost); setName(""); })}
            className="sq-btn sq-btn-primary"
          >
            Додати
          </button>
        </div>
      </div>

      {/* Rewards list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--sq-text)", letterSpacing: "-0.01em" }}>
          Нагороди
        </h2>
        {props.rewards.length === 0 && (
          <p style={{ fontSize: "0.85rem", color: "var(--sq-muted)" }}>Поки порожньо — додай першу 🎁</p>
        )}
        {props.rewards.map((r) => {
          const affordable = props.balance >= r.cost_xp;
          return (
            <div
              key={r.id}
              className="sq-card"
              style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 14 }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--sq-text)", marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--sq-accent2)" }}>{r.cost_xp} XP</div>
              </div>
              <button
                disabled={pending || !affordable}
                onClick={() =>
                  startTransition(async () => {
                    const res = await redeemReward(r.id);
                    setMsg(res.ok ? `Куплено: ${r.name} 🎉` : res.reason === "insufficient" ? "Замало XP" : "Помилка");
                  })
                }
                className="sq-btn sq-btn-primary"
                style={{ padding: "8px 18px", fontSize: "0.78rem" }}
              >
                {affordable ? "Купити" : "Замало"}
              </button>
            </div>
          );
        })}
      </div>

      {msg && (
        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--sq-success)" }}>{msg}</p>
      )}
    </div>
  );
}
