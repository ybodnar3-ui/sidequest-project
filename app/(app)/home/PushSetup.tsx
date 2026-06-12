"use client";

import { useState } from "react";
import { urlBase64ToUint8Array } from "@/lib/push/vapid";
import { savePushSubscription } from "./actions";

export function PushSetup() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function enable() {
    setMsg("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("error");
        setMsg("Сповіщення не підтримуються. Встанови застосунок на головний екран (Safari → Поділитися → На екран «Початок»).");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        setMsg("Дозвіл на сповіщення не надано.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!).buffer as ArrayBuffer,
      });
      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
      setStatus("ok");
      setMsg("Нагадування увімкнено ✅");
    } catch (e) {
      setStatus("error");
      setMsg("Не вдалося увімкнути сповіщення. На iOS це працює лише у встановленому застосунку.");
    }
  }

  if (status === "ok") {
    return <p className="text-sm text-green-600">{msg}</p>;
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <button onClick={enable} className="rounded-lg border px-4 py-2 text-sm">
        🔔 Увімкнути нагадування
      </button>
      {msg && <p className="max-w-xs text-center text-xs text-red-600">{msg}</p>}
    </div>
  );
}
