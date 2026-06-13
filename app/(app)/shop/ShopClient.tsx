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
    <div className="flex w-full max-w-md flex-col gap-5">
      <p className="text-sm">Баланс: <b>{props.balance} XP</b></p>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Додати нагороду</h2>
        <div className="flex flex-col gap-2">
          <input
            placeholder="Напр. морозиво, серія серіалу…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border p-2 text-sm"
          />
          <label className="flex items-center justify-between text-sm">
            Ціна в XP
            <input type="number" min={1} value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-20 rounded-lg border p-1 text-center" />
          </label>
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await addReward(name, cost); setName(""); })}
            className="rounded-lg bg-black p-2 text-sm text-white disabled:opacity-50"
          >
            Додати
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Нагороди</h2>
        {props.rewards.length === 0 && <p className="text-sm text-gray-500">Поки порожньо — додай першу 🎁</p>}
        {props.rewards.map((r) => {
          const affordable = props.balance >= r.cost_xp;
          return (
            <div key={r.id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-500">{r.cost_xp} XP</div>
              </div>
              <button
                disabled={pending || !affordable}
                onClick={() =>
                  startTransition(async () => {
                    const res = await redeemReward(r.id);
                    setMsg(res.ok ? `Куплено: ${r.name} 🎉` : res.reason === "insufficient" ? "Замало XP" : "Помилка");
                  })
                }
                className="rounded-lg bg-black px-3 py-1 text-sm text-white disabled:opacity-40"
              >
                {affordable ? "Купити" : "Замало"}
              </button>
            </div>
          );
        })}
      </section>
      {msg && <p className="text-center text-sm text-green-600">{msg}</p>}
    </div>
  );
}
