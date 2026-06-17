"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function DieMark({ size = 32 }: { size?: number }) {
  const pip = size * 0.14;
  const pad = size * 0.22;
  const mid = size / 2;
  const edge = size - pad;
  const positions: [number, number][] = [
    [pad, pad], [edge, pad], [mid, mid], [pad, edge], [edge, edge],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <rect x="2" y="2" width={size - 4} height={size - 4} rx={size * 0.18} fill="white" opacity="0.96" />
      {positions.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={pip} fill="#4f46e5" />
      ))}
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  async function handleGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <main
      className="sq-page"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: "24px" }}
    >
      {/* Ambient orbs */}
      <div className="sq-orb sq-page-orb-1" aria-hidden />
      <div className="sq-orb sq-page-orb-2" aria-hidden />

      {/* Card */}
      <div
        className="sq-card sq-animate-in"
        style={{ width: "100%", maxWidth: 400, padding: "40px 36px", display: "flex", flexDirection: "column", gap: 28, position: "relative", zIndex: 2 }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 4 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, background: "linear-gradient(135deg, #4f46e5, #7c5cfc)", borderRadius: 12, boxShadow: "0 0 24px rgba(109,94,250,0.5)" }}>
            <DieMark size={34} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 className="sq-heading" style={{ fontSize: "1.5rem", marginBottom: 4 }}>SideQuest</h1>
            <p style={{ color: "var(--sq-muted)", fontSize: "0.85rem" }}>Увійди та отримай свій квест дня</p>
          </div>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          className="sq-btn sq-btn-secondary"
          style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontFamily: "'PT Sans', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Увійти через Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--sq-border)" }} />
          <span style={{ color: "var(--sq-muted)", fontSize: "0.78rem" }}>або через пошту</span>
          <div style={{ flex: 1, height: 1, background: "var(--sq-border)" }} />
        </div>

        {/* Magic link form / success */}
        {sent ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>📬</div>
            <p style={{ color: "var(--sq-muted2)", lineHeight: 1.5 }}>
              Перевір пошту — ми надіслали посилання для входу на{" "}
              <strong style={{ color: "var(--sq-text)" }}>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sq-input"
            />
            <button className="sq-btn sq-btn-primary" style={{ width: "100%" }} type="submit">
              Надіслати посилання для входу
            </button>
            {error && (
              <p style={{ fontSize: "0.82rem", color: "var(--sq-error)", textAlign: "center" }}>{error}</p>
            )}
          </form>
        )}
      </div>

      <p style={{ marginTop: 20, fontSize: "0.76rem", color: "var(--sq-muted)", position: "relative", zIndex: 2 }}>
        Без картки · Безкоштовно назавжди
      </p>
    </main>
  );
}
