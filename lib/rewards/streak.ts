export function previousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(dt);
}

export interface StreakResult {
  current: number;
  best: number;
  lastDone: string;
}

export function computeStreak(lastDone: string | null, today: string, current: number, best: number): StreakResult {
  if (lastDone === today) {
    return { current, best, lastDone: today };
  }
  const next = lastDone === previousDateKey(today) ? current + 1 : 1;
  return { current: next, best: Math.max(best, next), lastDone: today };
}
