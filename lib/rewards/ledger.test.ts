import { describe, it, expect } from "vitest";
import { summarizeLedger } from "./ledger";

describe("summarizeLedger", () => {
  it("lifetime = positive deltas; balance = net of all deltas", () => {
    const r = summarizeLedger([{ delta: 15 }, { delta: 10 }, { delta: -20 }]);
    expect(r.lifetimeXp).toBe(25);
    expect(r.balance).toBe(5);
  });
  it("handles empty", () => {
    expect(summarizeLedger([])).toEqual({ lifetimeXp: 0, balance: 0 });
  });
  it("never lets balance below zero math affect lifetime", () => {
    const r = summarizeLedger([{ delta: 10 }, { delta: -10 }]);
    expect(r.lifetimeXp).toBe(10);
    expect(r.balance).toBe(0);
  });
});
