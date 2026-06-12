import { describe, it, expect } from "vitest";
import { QuestSchema, QUEST_CATEGORIES } from "./schema";

describe("QuestSchema", () => {
  it("accepts a valid quest", () => {
    const q = { title: "Say hi to a stranger", description: "Strike up a 1-minute chat with someone new nearby.", category: "social", est_minutes: 10, xp_value: 15 };
    expect(QuestSchema.parse(q)).toEqual(q);
  });
  it("rejects an unknown category", () => {
    expect(() => QuestSchema.parse({ title: "x", description: "y", category: "spaceflight", est_minutes: 10, xp_value: 10 })).toThrow();
  });
  it("exposes the four categories", () => {
    expect(QUEST_CATEGORIES).toEqual(["social", "body", "creative", "adventure"]);
  });
});
