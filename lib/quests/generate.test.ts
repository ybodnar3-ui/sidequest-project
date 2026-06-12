import { describe, it, expect, vi } from "vitest";
import { generateQuest } from "./generate";
import type { QuestContext } from "./prompt";

const ctx: QuestContext = { city: "Bali", weather: "clear, 31°C", mood: "good", categories: ["social", "body", "creative", "adventure"], recentTitles: [] };

it("returns the parsed quest from the model", async () => {
  const parsed = { title: "Compliment a stranger", description: "Give someone nearby a genuine compliment.", category: "social", est_minutes: 5, xp_value: 15 };
  const fakeClient = { messages: { parse: vi.fn().mockResolvedValue({ parsed_output: parsed }) } };
  const quest = await generateQuest(ctx, { client: fakeClient as never });
  expect(quest).toEqual(parsed);
  expect(fakeClient.messages.parse).toHaveBeenCalledOnce();
  const arg = fakeClient.messages.parse.mock.calls[0][0];
  expect(arg.model).toBe("claude-haiku-4-5");
});

it("throws when the model returns no parsed output", async () => {
  const fakeClient = { messages: { parse: vi.fn().mockResolvedValue({ parsed_output: null }) } };
  await expect(generateQuest(ctx, { client: fakeClient as never })).rejects.toThrow();
});
