"use client";

import { useState, useTransition } from "react";
import { saveSettings, type SettingsInput } from "./actions";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "social", label: "Соціальні" },
  { key: "body", label: "Тіло / рух" },
  { key: "creative", label: "Творчість / навчання" },
  { key: "adventure", label: "Пригоди / місто" },
];

const TIMEZONES: { value: string; label: string }[] = [
  { value: "Asia/Makassar", label: "Балі (UTC+8)" },
  { value: "Asia/Shanghai", label: "Китай (UTC+8)" },
  { value: "Asia/Bangkok", label: "Бангкок (UTC+7)" },
  { value: "Europe/Kyiv", label: "Київ (UTC+2/3)" },
  { value: "Europe/Lisbon", label: "Лісабон (UTC+0/1)" },
  { value: "Europe/Berlin", label: "Берлін (UTC+1/2)" },
  { value: "America/New_York", label: "Нью-Йорк (UTC-5/4)" },
  { value: "UTC", label: "UTC" },
];

const RHYTHMS: { value: SettingsInput["rhythm_mode"]; label: string }[] = [
  { value: "morning", label: "Ранковий" },
  { value: "popup", label: "Рандом-попап" },
  { value: "both", label: "Ранковий + попапи" },
];

export function SettingsForm(props: { initial: SettingsInput }) {
  const [cats, setCats] = useState<string[]>(props.initial.enabled_categories);
  const [tz, setTz] = useState(props.initial.time_zone);
  const [rhythm, setRhythm] = useState(props.initial.rhythm_mode);
  const [perDay, setPerDay] = useState(props.initial.quests_per_day);
  const [hour, setHour] = useState(props.initial.morning_push_hour);
  const [modules, setModules] = useState<string[]>(props.initial.enabled_reward_modules);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setSaved(false);
    setCats((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  }

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveSettings({
        enabled_categories: cats,
        time_zone: tz,
        rhythm_mode: rhythm,
        quests_per_day: perDay,
        morning_push_hour: hour,
        enabled_reward_modules: modules,
      });
      setSaved(true);
    });
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section>
        <h2 className="mb-2 font-semibold">Категорії квестів</h2>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cats.includes(c.key)} onChange={() => toggle(c.key)} />
              {c.label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Часовий пояс</h2>
        <select value={tz} onChange={(e) => { setTz(e.target.value); setSaved(false); }} className="w-full rounded-lg border p-2">
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">Визначає, коли в тебе починається новий «день квесту».</p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Ритм</h2>
        <div className="flex flex-col gap-2">
          {RHYTHMS.map((r) => (
            <label key={r.value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="rhythm" checked={rhythm === r.value} onChange={() => { setRhythm(r.value); setSaved(false); }} />
              {r.label}
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center justify-between text-sm">
          Квестів на день
          <input type="number" min={1} max={5} value={perDay} onChange={(e) => { setPerDay(Number(e.target.value)); setSaved(false); }} className="w-16 rounded-lg border p-1 text-center" />
        </label>
        <label className="mt-2 flex items-center justify-between text-sm">
          Година ранкового нагадування
          <input type="number" min={0} max={23} value={hour} onChange={(e) => { setHour(Number(e.target.value)); setSaved(false); }} className="w-16 rounded-lg border p-1 text-center" />
        </label>
        <p className="mt-1 text-xs text-gray-400">Попапи й персональна година — у наступній версії; поки нагадування раз на день.</p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Модулі нагород</h2>
        {[
          { key: "shop", label: "🎁 Магазин реальних нагород" },
          { key: "money", label: "💰 Грошовий банк" },
        ].map((m) => (
          <label key={m.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={modules.includes(m.key)}
              onChange={() => {
                setSaved(false);
                setModules((prev) =>
                  prev.includes(m.key) ? prev.filter((x) => x !== m.key) : [...prev, m.key],
                );
              }}
            />
            {m.label}
          </label>
        ))}
      </section>

      <button onClick={save} disabled={pending} className="rounded-lg bg-black p-3 text-white disabled:opacity-50">
        {pending ? "Зберігаю…" : "Зберегти"}
      </button>
      {saved && <p className="text-center text-sm text-green-600">Збережено ✅</p>}
    </div>
  );
}
