export function StatsBar(props: {
  level: number;
  totalXp: number;
  fraction: number;
  intoLevel: number;
  span: number;
  currentStreak: number;
}) {
  return (
    <div className="w-full max-w-md rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">Рівень {props.level}</span>
        <span className="text-gray-500">{props.totalXp} XP</span>
        <span title="Стрік">🔥 {props.currentStreak}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-black transition-all" style={{ width: `${Math.round(props.fraction * 100)}%` }} />
      </div>
      <div className="mt-1 text-right text-xs text-gray-400">
        {props.intoLevel}/{props.span} до наступного рівня
      </div>
    </div>
  );
}
