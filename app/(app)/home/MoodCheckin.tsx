"use client";

import { useTransition } from "react";
import { saveMood } from "./actions";

const MOODS: { key: string; emoji: string; label: string }[] = [
  { key: "great", emoji: "😄", label: "Чудово" },
  { key: "good", emoji: "🙂", label: "Добре" },
  { key: "meh", emoji: "😐", label: "Так собі" },
  { key: "low", emoji: "😔", label: "Кисло" },
];

export function MoodCheckin({ current }: { current: string | null }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="w-full max-w-md rounded-xl border p-4">
      <p className="mb-2 text-sm font-medium">Як настрій сьогодні?</p>
      <div className="flex justify-between gap-2">
        {MOODS.map((m) => (
          <button
            key={m.key}
            disabled={pending}
            onClick={() => startTransition(() => saveMood(m.key))}
            className={`flex flex-1 flex-col items-center rounded-lg border p-2 text-xs disabled:opacity-50 ${
              current === m.key ? "border-black bg-gray-100" : ""
            }`}
          >
            <span className="text-xl">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
