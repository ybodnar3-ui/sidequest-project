import Link from "next/link";

// CSS-only die mark: white rounded square with 5 indigo pips (classic die face 5)
function DieMark({ size = 40 }: { size?: number }) {
  const pip = size * 0.14;
  const r = size * 0.1;
  const pad = size * 0.22;
  const mid = size / 2;
  const edge = size - pad;
  const positions = [
    [pad, pad],
    [edge, pad],
    [mid, mid],
    [pad, edge],
    [edge, edge],
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width={size - 4}
        height={size - 4}
        rx={size * 0.18}
        fill="white"
        opacity="0.96"
      />
      {positions.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={pip} fill="#4f46e5" />
      ))}
    </svg>
  );
}

export function Landing() {
  return (
    <>
      {/* ── Google Fonts: Unbounded (display) + PT Sans (body) – both Cyrillic ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=PT+Sans:ital,wght@0,400;0,700;1,400&display=swap');

        :root {
          --sq-bg:       #070712;
          --sq-surface:  #0f0f23;
          --sq-card:     rgba(255,255,255,0.035);
          --sq-border:   rgba(120,100,255,0.14);
          --sq-accent:   #6d5efa;
          --sq-accent2:  #a78bfa;
          --sq-glow:     rgba(109,94,250,0.28);
          --sq-gold:     #fbbf24;
          --sq-text:     #f0eeff;
          --sq-muted:    #8b82b8;
          --sq-radius:   20px;
        }

        .sq-root {
          background: var(--sq-bg);
          color: var(--sq-text);
          font-family: 'PT Sans', system-ui, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          min-height: 100dvh;
        }

        /* ── Scrollbar ── */
        .sq-root::-webkit-scrollbar { width: 6px; }
        .sq-root::-webkit-scrollbar-track { background: var(--sq-bg); }
        .sq-root::-webkit-scrollbar-thumb { background: var(--sq-accent); border-radius: 3px; }

        /* ── Ambient orbs ── */
        .sq-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }
        .sq-orb-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle at 40% 40%, rgba(109,94,250,0.45), rgba(79,70,229,0.18) 60%, transparent);
          top: -160px; left: -200px;
          animation: orb-drift1 28s ease-in-out infinite alternate;
        }
        .sq-orb-2 {
          width: 380px; height: 380px;
          background: radial-gradient(circle at 60% 60%, rgba(167,139,250,0.32), rgba(139,92,246,0.12) 60%, transparent);
          top: 100px; right: -140px;
          animation: orb-drift2 22s ease-in-out infinite alternate;
        }
        .sq-orb-3 {
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(251,191,36,0.12), transparent 70%);
          bottom: 20px; left: 30%;
          animation: orb-drift3 34s ease-in-out infinite alternate;
        }

        @keyframes orb-drift1 {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(60px,-40px) scale(1.08); }
        }
        @keyframes orb-drift2 {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(-40px,60px) scale(0.94); }
        }
        @keyframes orb-drift3 {
          from { transform: translate(0,0); }
          to   { transform: translate(-50px,-30px); }
        }

        /* ── Grain overlay ── */
        .sq-grain::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.032;
          pointer-events: none;
          z-index: 9999;
        }

        /* ── Shared typography ── */
        .sq-display {
          font-family: 'Unbounded', sans-serif;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .sq-heading {
          font-family: 'Unbounded', sans-serif;
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .sq-label {
          font-family: 'Unbounded', sans-serif;
          font-weight: 400;
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--sq-accent2);
        }
        .sq-muted { color: var(--sq-muted); }

        /* ── Glass card ── */
        .sq-card {
          background: var(--sq-card);
          border: 1px solid var(--sq-border);
          border-radius: var(--sq-radius);
          backdrop-filter: blur(14px);
          box-shadow: 0 2px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        .sq-card:hover {
          border-color: rgba(120,100,255,0.32);
          box-shadow: 0 4px 60px var(--sq-glow), inset 0 1px 0 rgba(255,255,255,0.08);
          transform: translateY(-3px);
        }

        /* ── Buttons ── */
        .sq-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 100px;
          font-family: 'Unbounded', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          background: linear-gradient(135deg, #5b4fd8 0%, #7c5cfc 50%, #9d7bff 100%);
          color: white;
          text-decoration: none;
          box-shadow: 0 0 28px var(--sq-glow), 0 4px 16px rgba(0,0,0,0.4);
          transition: box-shadow 0.25s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1), filter 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .sq-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          border-radius: inherit;
        }
        .sq-btn-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 0 48px rgba(109,94,250,0.5), 0 8px 24px rgba(0,0,0,0.5);
          filter: brightness(1.1);
        }
        .sq-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 100px;
          font-family: 'Unbounded', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          background: transparent;
          color: var(--sq-accent2);
          text-decoration: none;
          border: 1.5px solid rgba(120,100,255,0.35);
          box-shadow: 0 0 12px var(--sq-glow);
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .sq-btn-secondary:hover {
          background: rgba(109,94,250,0.1);
          border-color: var(--sq-accent);
          box-shadow: 0 0 24px var(--sq-glow);
          transform: translateY(-1px);
        }

        /* ── Entry animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scalePop {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes dieFloat {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          50%     { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 28px var(--sq-glow), 0 4px 16px rgba(0,0,0,0.4); }
          50%     { box-shadow: 0 0 52px rgba(109,94,250,0.6), 0 4px 24px rgba(0,0,0,0.5); }
        }

        .sq-die-float { animation: dieFloat 6s ease-in-out infinite; }

        .sq-animate-1 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .sq-animate-2 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .sq-animate-3 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .sq-animate-4 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.44s both; }
        .sq-animate-5 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.58s both; }
        .sq-animate-6 { animation: scalePop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s both; }

        .sq-section-reveal {
          animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both;
          animation-timeline: view();
          animation-range: entry 0% entry 25%;
        }

        /* ── Gradient accent text ── */
        .sq-gradient-text {
          background: linear-gradient(120deg, #a78bfa 0%, #7c5cfc 40%, #c4b5fd 80%, #a78bfa 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .sq-gold-text {
          background: linear-gradient(120deg, #fcd34d 0%, #fbbf24 50%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Hero ── */
        .sq-hero {
          position: relative;
          overflow: hidden;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          padding: 80px 20px 60px;
        }
        .sq-hero-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          text-align: center;
        }
        .sq-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px 6px 8px;
          border-radius: 100px;
          background: rgba(109,94,250,0.12);
          border: 1px solid rgba(120,100,255,0.22);
          font-size: 0.75rem;
          color: var(--sq-accent2);
          margin-bottom: 28px;
          font-family: 'Unbounded', sans-serif;
        }
        .sq-hero-title {
          font-size: clamp(2rem, 6vw, 3.4rem);
          margin: 0 0 22px;
          color: var(--sq-text);
        }
        .sq-hero-sub {
          font-size: clamp(0.95rem, 2.5vw, 1.15rem);
          color: var(--sq-muted);
          max-width: 520px;
          margin: 0 auto 36px;
          line-height: 1.65;
        }
        .sq-hero-cta-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .sq-hero-note {
          font-size: 0.8rem;
          color: var(--sq-muted);
          opacity: 0.7;
        }
        .sq-btn-pulse { animation: pulse-glow 3s ease-in-out infinite; }

        /* ── Section containers ── */
        .sq-section {
          position: relative;
          padding: 80px 20px;
          max-width: 960px;
          margin: 0 auto;
        }
        .sq-section-title {
          text-align: center;
          margin-bottom: 52px;
        }

        /* ── Steps ── */
        .sq-steps {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .sq-steps { grid-template-columns: repeat(3, 1fr); }
        }
        .sq-step {
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sq-step-num {
          font-family: 'Unbounded', sans-serif;
          font-weight: 900;
          font-size: 2.2rem;
          line-height: 1;
          background: linear-gradient(135deg, rgba(109,94,250,0.5), rgba(167,139,250,0.25));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
          margin-bottom: 4px;
        }
        .sq-step-title {
          font-family: 'Unbounded', sans-serif;
          font-weight: 700;
          font-size: 0.92rem;
          color: var(--sq-text);
        }
        .sq-step-desc {
          font-size: 0.88rem;
          color: var(--sq-muted);
          line-height: 1.55;
        }
        .sq-step-connector {
          display: none;
          align-items: center;
          justify-content: center;
          color: var(--sq-border);
          font-size: 1.4rem;
        }
        @media (min-width: 640px) {
          .sq-step-connector { display: flex; }
        }

        /* ── Features grid ── */
        .sq-features {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 480px) {
          .sq-features { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 800px) {
          .sq-features { grid-template-columns: repeat(3, 1fr); }
        }
        .sq-feature {
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sq-feature-icon {
          font-size: 1.8rem;
          display: block;
          line-height: 1;
        }
        .sq-feature-title {
          font-family: 'Unbounded', sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          color: var(--sq-text);
        }
        .sq-feature-desc {
          font-size: 0.83rem;
          color: var(--sq-muted);
          line-height: 1.5;
        }

        /* ── Pricing ── */
        .sq-pricing {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr;
          max-width: 700px;
          margin: 0 auto;
        }
        @media (min-width: 600px) {
          .sq-pricing { grid-template-columns: 1fr 1fr; }
        }
        .sq-price-card {
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }
        .sq-price-card-pro {
          background: linear-gradient(145deg, rgba(109,94,250,0.12) 0%, rgba(124,92,252,0.07) 100%);
          border-color: rgba(120,100,255,0.35);
          box-shadow: 0 0 50px rgba(109,94,250,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .sq-price-card-pro:hover {
          box-shadow: 0 0 70px rgba(109,94,250,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
          border-color: rgba(120,100,255,0.6);
        }
        .sq-pro-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(90deg, #5b4fd8, #7c5cfc);
          color: white;
          font-family: 'Unbounded', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 100px;
          white-space: nowrap;
          box-shadow: 0 0 16px var(--sq-glow);
        }
        .sq-price-name {
          font-family: 'Unbounded', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: var(--sq-text);
        }
        .sq-price-amount {
          font-family: 'Unbounded', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          color: var(--sq-text);
          line-height: 1;
        }
        .sq-price-sub {
          font-size: 0.8rem;
          color: var(--sq-muted);
          margin-top: 4px;
        }
        .sq-price-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .sq-price-features li {
          font-size: 0.85rem;
          color: var(--sq-muted);
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .sq-price-features li::before {
          content: '✓';
          color: var(--sq-accent2);
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* ── Final CTA band ── */
        .sq-cta-band {
          position: relative;
          overflow: hidden;
          padding: 80px 20px;
          text-align: center;
        }
        .sq-cta-band::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(109,94,250,0.08) 0%, rgba(124,92,252,0.04) 100%);
          border-top: 1px solid rgba(120,100,255,0.1);
          border-bottom: 1px solid rgba(120,100,255,0.1);
        }
        .sq-cta-band-title {
          font-size: clamp(1.4rem, 4vw, 2.2rem);
          margin: 0 0 28px;
          color: var(--sq-text);
          position: relative;
        }

        /* ── Footer ── */
        .sq-footer {
          padding: 28px 20px;
          border-top: 1px solid var(--sq-border);
          text-align: center;
          color: var(--sq-muted);
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        /* ── Section divider ── */
        .sq-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--sq-border), transparent);
          margin: 0;
          border: none;
        }

        /* ── Die mark accent ── */
        .sq-die-accent {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #4f46e5, #7c5cfc);
          border-radius: 8px;
          box-shadow: 0 0 18px rgba(109,94,250,0.4);
          flex-shrink: 0;
        }
      `}</style>

      <div className="sq-root sq-grain">

        {/* ════════════ HERO ════════════ */}
        <section className="sq-hero">
          {/* Ambient orbs */}
          <div className="sq-orb sq-orb-1" aria-hidden />
          <div className="sq-orb sq-orb-2" aria-hidden />
          <div className="sq-orb sq-orb-3" aria-hidden />

          <div className="sq-hero-inner">
            {/* Badge */}
            <div className="sq-animate-1">
              <span className="sq-hero-badge">
                <span className="sq-die-float" style={{ display: "inline-flex" }}>
                  <DieMark size={22} />
                </span>
                SideQuest · AI щоденних пригод
              </span>
            </div>

            {/* Headline */}
            <h1 className="sq-display sq-hero-title sq-animate-2">
              Один сайд-квест щодня —{" "}
              <span className="sq-gradient-text">і життя стає цікавішим</span>
            </h1>

            {/* Subhead */}
            <p className="sq-hero-sub sq-animate-3">
              AI щоранку дає тобі маленький квест на 5–15 хвилин під твоє
              місто, погоду й настрій. Виконуєш — отримуєш{" "}
              <span style={{ color: "var(--sq-gold)", fontWeight: 700 }}>
                XP, рівні та стріки.
              </span>
            </p>

            {/* CTA */}
            <div className="sq-hero-cta-group sq-animate-4">
              <Link href="/login" className="sq-btn-primary sq-btn-pulse">
                Почати безкоштовно →
              </Link>
              <p className="sq-hero-note">
                Без картки. Перший квест — за 30 секунд.
              </p>
            </div>

            {/* Floating die decoration */}
            <div
              className="sq-animate-5"
              style={{
                marginTop: 52,
                display: "flex",
                justifyContent: "center",
                gap: 24,
                opacity: 0.55,
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="sq-die-float"
                  style={{
                    animationDelay: `${i * 1.4}s`,
                    filter: `drop-shadow(0 0 12px rgba(109,94,250,${0.7 - i * 0.15}))`,
                    opacity: 1 - i * 0.25,
                  }}
                >
                  <DieMark size={i === 0 ? 44 : i === 1 ? 34 : 26} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="sq-divider" />

        {/* ════════════ ЯК ЦЕ ПРАЦЮЄ ════════════ */}
        <section style={{ padding: "80px 20px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="sq-section-title sq-section-reveal">
              <span className="sq-label">Принцип роботи</span>
              <h2
                className="sq-heading"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.1rem)", marginTop: 14, color: "var(--sq-text)" }}
              >
                Як це працює
              </h2>
            </div>

            <div className="sq-steps sq-section-reveal">
              {/* Step 1 */}
              <div className="sq-card sq-step">
                <span className="sq-step-num">01</span>
                <span className="sq-step-title">Щоранку — персональний квест</span>
                <p className="sq-step-desc">
                  AI аналізує твоє місто, поточну погоду та настрій і генерує
                  унікальний квест саме для тебе.
                </p>
              </div>

              {/* Step 2 */}
              <div className="sq-card sq-step">
                <span className="sq-step-num">02</span>
                <span className="sq-step-title">Виконуєш за 5–15 хв</span>
                <p className="sq-step-desc">
                  Маленький, але справжній challenge: дослідити місце, спробувати
                  щось нове, помітити деталь навколо.
                </p>
              </div>

              {/* Step 3 */}
              <div className="sq-card sq-step">
                <span className="sq-step-num">03</span>
                <span className="sq-step-title">XP, рівні, стріки 🎉</span>
                <p className="sq-step-desc">
                  Заробляєш XP, ростеш у рівнях, підтримуєш стрік і відкриваєш
                  нагороди — кожен день трохи краще.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="sq-divider" />

        {/* ════════════ МОЖЛИВОСТІ ════════════ */}
        <section style={{ padding: "80px 20px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div className="sq-section-title sq-section-reveal">
              <span className="sq-label">Що всередині</span>
              <h2
                className="sq-heading"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.1rem)", marginTop: 14, color: "var(--sq-text)" }}
              >
                Можливості
              </h2>
            </div>

            <div className="sq-features sq-section-reveal">
              {[
                {
                  icon: "🌍",
                  title: "AI-персоналізація",
                  desc: "Квест під місто, погоду і твій настрій. Ніяких шаблонів.",
                },
                {
                  icon: "🏆",
                  title: "Гейміфікація",
                  desc: "XP, рівні, стріки, журнал пригод — прогрес, який мотивує.",
                },
                {
                  icon: "🎁",
                  title: "Нагороди",
                  desc: "Магазин предметів і грошовий банк для справжніх досягнень.",
                },
                {
                  icon: "🔔",
                  title: "Пуш-нагадування",
                  desc: "Не пропустиш квест дня — м'яке нагадування у потрібний момент.",
                },
                {
                  icon: "📱",
                  title: "PWA — на телефон",
                  desc: "Встанови як застосунок без магазину. Працює офлайн.",
                },
                {
                  icon: "🔒",
                  title: "Приватність",
                  desc: "Твої квести й нотатки — тільки твої. Без зайвого трекінгу.",
                },
              ].map((f) => (
                <div key={f.title} className="sq-card sq-feature">
                  <span className="sq-feature-icon">{f.icon}</span>
                  <span className="sq-feature-title">{f.title}</span>
                  <p className="sq-feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="sq-divider" />

        {/* ════════════ ЦІНИ ════════════ */}
        <section style={{ padding: "80px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div className="sq-section-title sq-section-reveal">
              <span className="sq-label">Плани</span>
              <h2
                className="sq-heading"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.1rem)", marginTop: 14, color: "var(--sq-text)" }}
              >
                Ціни
              </h2>
            </div>

            <div className="sq-pricing sq-section-reveal">
              {/* Free */}
              <div className="sq-card sq-price-card">
                <div>
                  <p className="sq-label" style={{ marginBottom: 8 }}>Старт</p>
                  <p className="sq-price-name">Безкоштовно</p>
                </div>
                <div>
                  <p className="sq-price-amount">$0</p>
                  <p className="sq-price-sub">назавжди</p>
                </div>
                <ul className="sq-price-features">
                  <li>Квест дня від AI</li>
                  <li>XP, рівні та стріки</li>
                  <li>Журнал пригод</li>
                  <li>Чек-ін настрою</li>
                </ul>
                <Link href="/login" className="sq-btn-secondary" style={{ textAlign: "center" }}>
                  Почати
                </Link>
              </div>

              {/* Pro */}
              <div className="sq-card sq-price-card sq-price-card-pro" style={{ position: "relative" }}>
                <span className="sq-pro-badge">Найпопулярніше</span>
                <div>
                  <p className="sq-label" style={{ marginBottom: 8, color: "var(--sq-accent2)" }}>Повний доступ</p>
                  <p className="sq-price-name">
                    Pro{" "}
                    <span className="sq-gradient-text" style={{ fontSize: "0.85rem", fontWeight: 400 }}>
                      (усе +)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="sq-price-amount sq-gold-text">$3</p>
                  <p className="sq-price-sub">на місяць</p>
                </div>
                <ul className="sq-price-features">
                  <li>Усе з безкоштовного</li>
                  <li>🎁 Модулі нагород (магазин + банк)</li>
                  <li>🔔 Пуш-нагадування</li>
                  <li>Пріоритетна підтримка</li>
                </ul>
                <Link href="/login" className="sq-btn-primary" style={{ justifyContent: "center" }}>
                  Спробувати Pro
                </Link>
              </div>
            </div>
          </div>
        </section>

        <hr className="sq-divider" />

        {/* ════════════ FINAL CTA ════════════ */}
        <div className="sq-cta-band sq-section-reveal">
          <h2 className="sq-heading sq-cta-band-title">
            Зроби завтрашній день{" "}
            <span className="sq-gradient-text">трохи цікавішим</span>
          </h2>
          <Link href="/login" className="sq-btn-primary">
            Почати безкоштовно →
          </Link>
        </div>

        {/* ════════════ FOOTER ════════════ */}
        <footer className="sq-footer">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="sq-die-accent">
              <DieMark size={20} />
            </div>
            <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "var(--sq-text)" }}>
              SideQuest
            </span>
          </div>
          <p className="sq-muted">зроблено для мандрівників · з любов&apos;ю до малих пригод</p>
        </footer>
      </div>
    </>
  );
}
