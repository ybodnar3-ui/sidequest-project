"use client";

import { useState } from "react";
import { saveLocation } from "./actions";

export function LocationSetup() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function detect() {
    setError(null);
    setBusy(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      const { latitude, longitude } = pos.coords;
      let city = "";
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1`);
        const j = await r.json();
        city = j?.results?.[0]?.name ?? "";
      } catch {
        /* city is optional */
      }
      await saveLocation(city, latitude, longitude);
    } catch {
      setError("Не вдалося отримати локацію. Дозволь доступ до геолокації та спробуй ще.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="sq-card sq-animate-in sq-delay-2"
      style={{ width: "100%", maxWidth: 480, padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}
    >
      <div style={{ fontSize: "2.4rem" }}>📍</div>
      <p style={{ color: "var(--sq-muted2)", fontSize: "0.9rem", lineHeight: 1.6 }}>
        Щоб квести підлаштовувались під твоє місто й погоду, дозволь визначити локацію.
      </p>
      <button
        onClick={detect}
        disabled={busy}
        className="sq-btn sq-btn-primary"
        style={{ width: "100%" }}
      >
        {busy ? "Визначаю…" : "Визначити мою локацію 📍"}
      </button>
      {error && (
        <p style={{ fontSize: "0.8rem", color: "var(--sq-error)" }}>{error}</p>
      )}
    </div>
  );
}
