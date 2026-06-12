import { describe, it, expect } from "vitest";
import { cumXpForLevel, levelForXp, levelProgress } from "./levels";

describe("cumXpForLevel", () => {
  it("matches the curve", () => {
    expect(cumXpForLevel(1)).toBe(0);
    expect(cumXpForLevel(2)).toBe(100);
    expect(cumXpForLevel(3)).toBe(300);
    expect(cumXpForLevel(5)).toBe(1000);
  });
});

describe("levelForXp", () => {
  it("returns the right level at boundaries", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
  });
});

describe("levelProgress", () => {
  it("reports xp into the level and to the next", () => {
    const p = levelProgress(150);
    expect(p.level).toBe(2);
    expect(p.intoLevel).toBe(50);
    expect(p.span).toBe(200);
    expect(p.fraction).toBeCloseTo(0.25, 5);
  });
  it("handles exactly a boundary", () => {
    const p = levelProgress(100);
    expect(p.level).toBe(2);
    expect(p.intoLevel).toBe(0);
    expect(p.fraction).toBe(0);
  });
});
