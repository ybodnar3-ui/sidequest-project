"use client";

import { useTransition } from "react";
import { completeQuest } from "./actions";

const CATEGORY_LABEL: Record<string, string> = {
  social: "Соціальний",
  body: "Тіло",
  creative: "Творчість",
  adventure: "Пригода",
};

export function QuestCard(props: {
  id: string;
  title: string;
  description: string;
  category: string;
  estMinutes: number;
  xpValue: number;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const done = props.status === "done";

  return (
    <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>{CATEGORY_LABEL[props.category] ?? props.category}</span>
        <span>~{props.estMinutes} хв · {props.xpValue} XP</span>
      </div>
      <h2 className="mb-2 text-xl font-bold">{props.title}</h2>
      <p className="mb-5 text-gray-700">{props.description}</p>
      {done ? (
        <p className="text-center font-semibold text-green-600">✅ Виконано!</p>
      ) : (
        <button
          disabled={pending}
          onClick={() => startTransition(() => completeQuest(props.id))}
          className="w-full rounded-lg bg-black p-3 text-white disabled:opacity-50"
        >
          {pending ? "Зберігаю…" : "Виконати ✅"}
        </button>
      )}
    </div>
  );
}
