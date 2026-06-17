"use client";

import { useState, useTransition } from "react";
import { saveSettings, type SettingsInput } from "./actions";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "social",    label: "Соціальні" },
  { key: "body",      label: "Тіло / рух" },
  { key: "creative",  label: "Творчість / навчання" },
  { key: "adventure", label: "Пригоди / місто" },
];

const TIMEZONES: { value: string; label: string }[] = [
  { value: "Asia/Makassar",   label: "Балі (UTC+8)" },
  { value: "Asia/Shanghai",   label: "Китай (UTC+8)" },
  { value: "Asia/Bangkok",    label: "Бангкок (UTC+7)" },
  { value: "Europe/Kyiv",     label: "Київ (UTC+2/3)" },
  { value: "Europe/Lisbon",   label: "Лісабон (UTC+0/1)" },
  { value: "Europe/Berlin",   label: "Берлін (UTC+1/2)" },
  { value: "America/New_York", label: "Нью-Йорк (UTC-5/4)" },
  { value: "UTC",             label: "UTC" },
];

const RHYTHMS: { value: SettingsInput["rhythm_mode"]; label: string }[] = [
  { value: "morning", label: "Ранковий" },
  { value: "popup",   label: "Рандом-попап" },
  { value: "both",    label: "Ранковий + попапи" },
];

/* ─── small shared styles ─── */
const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
const sectionHeadStyle: React.CSSProperties = {
  fontFamily: "'Unbounded', sans-serif",
  fontWeight: 700,
  fontSize: "0.78rem",
  color: "var(--sq-text)",
  letterSpacing: "-0.01em",
  marginBottom: 2,
};
const labelRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontSize: "0.88rem",
  color: "var(--sq-muted2)",
  cursor: "pointer",
};
const checkboxStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  accentColor: "var(--sq-accent)",
  cursor: "pointer",
  flexShrink: 0,
};
const hintStyle: React.CSSProperties = {
  fontSize: "0.74rem",
  color: "var(--sq-muted)",
  lineHeight: 1.5,
};

export function SettingsForm(props: { initial: SettingsInput }) {
  const [cats, setCats]     = useState<string[]>(props.initial.enabled_categories);
  const [tz, setTz]         = useState(props.initial.time_zone);
  const [rhythm, setRhythm] = useState(props.initial.rhythm_mode);
  const [perDay, setPerDay] = useState(props.initial.quests_per_day);
  const [hour, setHour]     = useState(props.initial.morning_push_hour);
  const [modules, setModules] = useState<string[]>(props.initial.enabled_reward_modules);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved]   = useState(false);

  function toggle(key: string) {
    setSaved(false);
    setCats((prev) => prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]);
  }

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveSettings({ enabled_categories: cats, time_zone: tz, rhythm_mode: rhythm, quests_per_day: perDay, morning_push_hour: hour, enabled_reward_modules: modules });
      setSaved(true);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Categories */}
      <div className="sq-card sq-animate-in sq-delay-1" style={{ padding: "20px 20px" }}>
        <div style={sectionStyle}>
          <h2 style={sectionHeadStyle}>Категорії квестів</h2>
          {CATEGORIES.map((c) => (
            <label key={c.key} style={labelRowStyle}>
              <input type="checkbox" checked={cats.includes(c.key)} onChange={() => toggle(c.key)} style={checkboxStyle} />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      {/* Timezone */}
      <div className="sq-card sq-animate-in sq-delay-2" style={{ padding: "20px 20px" }}>
        <div style={sectionStyle}>
          <h2 style={sectionHeadStyle}>Часовий пояс</h2>
          <select
            value={tz}
            onChange={(e) => { setTz(e.target.value); setSaved(false); }}
            className="sq-select"
          >
            {TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p style={hintStyle}>Визначає, коли в тебе починається новий «день квесту».</p>
        </div>
      </div>

      {/* Rhythm */}
      <div className="sq-card sq-animate-in sq-delay-3" style={{ padding: "20px 20px" }}>
        <div style={sectionStyle}>
          <h2 style={sectionHeadStyle}>Ритм</h2>
          {RHYTHMS.map((r) => (
            <label key={r.value} style={labelRowStyle}>
              <input
                type="radio"
                name="rhythm"
                checked={rhythm === r.value}
                onChange={() => { setRhythm(r.value); setSaved(false); }}
                style={checkboxStyle}
              />
              {r.label}
            </label>
          ))}
          <label style={{ ...labelRowStyle, justifyContent: "space-between", marginTop: 4 }}>
            Квестів на день
            <input
              type="number"
              min={1}
              max={5}
              value={perDay}
              onChange={(e) => { setPerDay(Number(e.target.value)); setSaved(false); }}
              className="sq-input"
              style={{ width: 72, textAlign: "center" }}
            />
          </label>
          <label style={{ ...labelRowStyle, justifyContent: "space-between" }}>
            Година ранкового нагадування
            <input
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => { setHour(Number(e.target.value)); setSaved(false); }}
              className="sq-input"
              style={{ width: 72, textAlign: "center" }}
            />
          </label>
          <p style={hintStyle}>Попапи й персональна година — у наступній версії; поки нагадування раз на день.</p>
        </div>
      </div>

      {/* Modules */}
      <div className="sq-card sq-animate-in sq-delay-4" style={{ padding: "20px 20px" }}>
        <div style={sectionStyle}>
          <h2 style={sectionHeadStyle}>Модулі нагород</h2>
          {[
            { key: "shop",  label: "🎁 Магазин реальних нагород" },
            { key: "money", label: "💰 Грошовий банк" },
          ].map((m) => (
            <label key={m.key} style={labelRowStyle}>
              <input
                type="checkbox"
                checked={modules.includes(m.key)}
                onChange={() => {
                  setSaved(false);
                  setModules((prev) => prev.includes(m.key) ? prev.filter((x) => x !== m.key) : [...prev, m.key]);
                }}
                style={checkboxStyle}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={save}
        disabled={pending}
        className="sq-btn sq-btn-primary sq-animate-in sq-delay-5"
        style={{ width: "100%" }}
      >
        {pending ? "Зберігаю…" : "Зберегти"}
      </button>

      {saved && (
        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--sq-success)" }}>
          Збережено ✅
        </p>
      )}
    </div>
  );
}
