export function cumXpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelForXp(totalXp: number): number {
  let level = 1;
  while (cumXpForLevel(level + 1) <= totalXp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  intoLevel: number;
  span: number;
  fraction: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp);
  const base = cumXpForLevel(level);
  const next = cumXpForLevel(level + 1);
  const span = next - base;
  const intoLevel = totalXp - base;
  return { level, intoLevel, span, fraction: span === 0 ? 0 : intoLevel / span };
}
