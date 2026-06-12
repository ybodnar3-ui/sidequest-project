import { describe, it, expect } from "vitest";
import { previousDateKey, computeStreak } from "./streak";

describe("previousDateKey", () => {
  it("subtracts one calendar day", () => {
    expect(previousDateKey("2026-06-13")).toBe("2026-06-12");
    expect(previousDateKey("2026-01-01")).toBe("2025-12-31");
    expect(previousDateKey("2026-03-01")).toBe("2026-02-28");
  });
});

describe("computeStreak", () => {
  it("starts a streak when there is no prior completion", () => {
    expect(computeStreak(null, "2026-06-13", 0, 0)).toEqual({ current: 1, best: 1, lastDone: "2026-06-13" });
  });
  it("increments when the last completion was yesterday", () => {
    expect(computeStreak("2026-06-12", "2026-06-13", 4, 4)).toEqual({ current: 5, best: 5, lastDone: "2026-06-13" });
  });
  it("does not change when already completed today", () => {
    expect(computeStreak("2026-06-13", "2026-06-13", 5, 7)).toEqual({ current: 5, best: 7, lastDone: "2026-06-13" });
  });
  it("resets to 1 after a gap, keeping best", () => {
    expect(computeStreak("2026-06-10", "2026-06-13", 9, 9)).toEqual({ current: 1, best: 9, lastDone: "2026-06-13" });
  });
});
