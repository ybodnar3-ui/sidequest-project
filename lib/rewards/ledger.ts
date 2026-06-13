export function summarizeLedger(rows: { delta: number }[]): {
  lifetimeXp: number;
  balance: number;
} {
  let lifetimeXp = 0;
  let balance = 0;
  for (const r of rows) {
    balance += r.delta;
    if (r.delta > 0) lifetimeXp += r.delta;
  }
  return { lifetimeXp, balance };
}
