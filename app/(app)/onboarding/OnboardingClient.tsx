"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finishOnboarding } from "./actions";
import { LocationSetup } from "../home/LocationSetup";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "social",    label: "Соціальні" },
  { key: "body",      label: "Тіло · рух" },
  { key: "creative",  label: "Творчість · навчання" },
  { key: "adventure", label: "Пригоди · місто" },
];

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCats, setSelectedCats] = useState<string[]>(
    CATEGORIES.map((c) => c.key),
  );
  const [pending, startTransition] = useTransition();

  function toggleCat(key: string) {
    setSelectedCats((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  }

  function finish() {
    startTransition(async () => {
      await finishOnboarding(selectedCats);
      router.push("/home");
    });
  }

  return (
    <div
      className="sq-card sq-animate-in"
      style={{
        width: "100%",
        maxWidth: 440,
        padding: "36px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* Progress indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 100,
              background:
                n <= step
                  ? "linear-gradient(90deg, var(--sq-accent), var(--sq-accent2))"
                  : "rgba(255,255,255,0.1)",
              boxShadow: n <= step ? "0 0 8px rgba(109,94,250,0.6)" : "none",
              transition: "background 0.4s ease, box-shadow 0.4s ease",
            }}
          />
        ))}
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--sq-muted)",
            fontFamily: "'Unbounded', sans-serif",
            whiteSpace: "nowrap",
            marginLeft: 4,
          }}
        >
          {step}/3
        </span>
      </div>

      {/* Step 1 — Welcome */}
      {step === 1 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", textAlign: "center" }}
        >
          <div style={{ fontSize: "3rem" }}>🎲</div>
          <h1
            className="sq-heading"
            style={{ fontSize: "1.4rem", lineHeight: 1.25 }}
          >
            Ласкаво просимо в SideQuest 🎲
          </h1>
          <p style={{ color: "var(--sq-muted2)", fontSize: "0.92rem", lineHeight: 1.7 }}>
            Щодня — один маленький квест (5–15 хв) під твоє місто, погоду й настрій.
            Виконуєш — ростуть XP, рівні та стріки.
          </p>
          <button
            onClick={() => setStep(2)}
            className="sq-btn sq-btn-primary"
            style={{ width: "100%", marginTop: 4 }}
          >
            Почнімо →
          </button>
        </div>
      )}

      {/* Step 2 — Pick categories */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <h2 className="sq-heading" style={{ fontSize: "1.15rem", marginBottom: 8 }}>
              Які квести тобі цікаві?
            </h2>
            <p style={{ color: "var(--sq-muted)", fontSize: "0.83rem" }}>
              Обери одну або кілька категорій
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CATEGORIES.map((cat) => {
              const selected = selectedCats.includes(cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() => toggleCat(cat.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 18px",
                    borderRadius: "var(--sq-radius-sm)",
                    border: selected
                      ? "1.5px solid var(--sq-accent)"
                      : "1.5px solid var(--sq-border)",
                    background: selected
                      ? "rgba(109,94,250,0.12)"
                      : "rgba(255,255,255,0.03)",
                    color: selected ? "var(--sq-text)" : "var(--sq-muted2)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    boxShadow: selected ? "0 0 12px rgba(109,94,250,0.2)" : "none",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: selected ? "none" : "1.5px solid var(--sq-border)",
                      background: selected
                        ? "linear-gradient(135deg, var(--sq-accent), var(--sq-accent2))"
                        : "transparent",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "0.6rem",
                      color: "#fff",
                    }}
                  >
                    {selected ? "✓" : ""}
                  </span>
                  {cat.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={selectedCats.length === 0}
            className="sq-btn sq-btn-primary"
            style={{ width: "100%" }}
          >
            Далі →
          </button>
        </div>
      )}

      {/* Step 3 — Location */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <h2 className="sq-heading" style={{ fontSize: "1.15rem", marginBottom: 8 }}>
              Де ти зараз?
            </h2>
            <p style={{ color: "var(--sq-muted)", fontSize: "0.83rem", lineHeight: 1.6 }}>
              Щоб квести підлаштовувались під місце й погоду
            </p>
          </div>

          <LocationSetup />

          <button
            onClick={finish}
            disabled={pending}
            className="sq-btn sq-btn-secondary"
            style={{ width: "100%" }}
          >
            {pending ? "Збереження…" : "Пропустити / Готово"}
          </button>
        </div>
      )}
    </div>
  );
}
