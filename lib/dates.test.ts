import { describe, it, expect } from "vitest";
import { getQuestDateKey } from "./dates";

describe("getQuestDateKey", () => {
  it("returns the local date in Asia/Makassar (Bali, UTC+8)", () => {
    // 2026-06-09T18:30Z is 2026-06-10 02:30 in Bali
    const d = new Date("2026-06-09T18:30:00Z");
    expect(getQuestDateKey(d, "Asia/Makassar")).toBe("2026-06-10");
  });

  it("returns the local date in UTC", () => {
    const d = new Date("2026-06-09T18:30:00Z");
    expect(getQuestDateKey(d, "UTC")).toBe("2026-06-09");
  });

  it("handles year/month rollover", () => {
    const d = new Date("2025-12-31T20:00:00Z");
    expect(getQuestDateKey(d, "Asia/Makassar")).toBe("2026-01-01");
  });
});
