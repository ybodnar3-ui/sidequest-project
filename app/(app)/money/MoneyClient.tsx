"use client";

import { useState, useTransition } from "react";
import { addStake, resolveStake } from "./actions";

interface Stake {
  id: string;
  amount: number;
  currency: string;
  outcome: string;
  note: string | null;
}

export function MoneyClient(props: { stakes: Stake[] }) {
  const [amount, setAmount] = useState(5);
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <p className="text-xs text-gray-500">
        Облік ставок на виконання (без реальних платежів). Постав суму «на кін» — і чесно
        познач, виконав чи злив.
      </p>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Нова ставка</h2>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-24 rounded-lg border p-2 text-sm" />
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className="w-20 rounded-lg border p-2 text-center text-sm" />
          </div>
          <input placeholder="На що (необов'язково)" value={note} onChange={(e) => setNote(e.target.value)} className="rounded-lg border p-2 text-sm" />
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await addStake(amount, currency, note); setNote(""); })}
            className="rounded-lg bg-black p-2 text-sm text-white disabled:opacity-50"
          >
            Поставити
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Ставки</h2>
        {props.stakes.length === 0 && <p className="text-sm text-gray-500">Поки немає ставок.</p>}
        {props.stakes.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="font-medium">{s.amount} {s.currency}</div>
              {s.note && <div className="text-xs text-gray-500">{s.note}</div>}
            </div>
            {s.outcome === "open" ? (
              <div className="flex gap-2">
                <button disabled={pending} onClick={() => startTransition(() => resolveStake(s.id, "won"))} className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50">Виконав</button>
                <button disabled={pending} onClick={() => startTransition(() => resolveStake(s.id, "lost"))} className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50">Злив</button>
              </div>
            ) : (
              <span className={`text-sm font-semibold ${s.outcome === "won" ? "text-green-600" : "text-red-600"}`}>
                {s.outcome === "won" ? "✅ Виконав" : "❌ Злив"}
              </span>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
