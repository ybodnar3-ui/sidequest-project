export function StatsBar(props: {
  level: number;
  lifetimeXp: number;
  balance: number;
  fraction: number;
  intoLevel: number;
  span: number;
  currentStreak: number;
}) {
  return (
    <div className="sq-card sq-animate-in sq-delay-1" style={{ width: "100%", maxWidth: 480, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        {/* Level */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="sq-label">Рівень</span>
          <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: "1.4rem", color: "var(--sq-accent2)", lineHeight: 1 }}>
            {props.level}
          </span>
        </div>
        {/* XP total */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          <span className="sq-label">XP</span>
          <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--sq-text)" }}>
            {props.lifetimeXp}
          </span>
        </div>
        {/* Streak */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
          <span className="sq-label">Стрік</span>
          <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "var(--sq-gold)", lineHeight: 1 }}>
            🔥 {props.currentStreak}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="sq-progress-track">
        <div className="sq-progress-fill" style={{ width: `${Math.round(props.fraction * 100)}%` }} />
      </div>

      {/* Sub-row */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontSize: "0.75rem", color: "var(--sq-muted)" }}>
          {props.intoLevel}/{props.span} до наступного рівня
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--sq-muted)" }}>
          Баланс: {props.balance} XP
        </span>
      </div>
    </div>
  );
}
