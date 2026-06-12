import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserContext } from "./prompt";

describe("buildSystemPrompt", () => {
  it("states the core rules (one quest, 5-15 min, categories)", () => {
    const s = buildSystemPrompt();
    expect(s).toContain("5");
    expect(s).toContain("15");
    expect(s.toLowerCase()).toContain("quest");
  });
});

describe("buildUserContext", () => {
  it("includes city, weather, mood, categories, and recent titles", () => {
    const ctx = buildUserContext({ city: "Bali", weather: "clear, 31°C", mood: "good", categories: ["social", "body"], recentTitles: ["Call an old friend"] });
    expect(ctx).toContain("Bali");
    expect(ctx).toContain("clear, 31°C");
    expect(ctx).toContain("good");
    expect(ctx).toContain("social");
    expect(ctx).toContain("Call an old friend");
  });
  it("handles missing optional fields gracefully", () => {
    const ctx = buildUserContext({ city: null, weather: null, mood: null, categories: ["creative"], recentTitles: [] });
    expect(ctx).toContain("creative");
    expect(typeof ctx).toBe("string");
  });
});
