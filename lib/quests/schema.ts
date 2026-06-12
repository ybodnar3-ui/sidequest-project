import { z } from "zod";

export const QUEST_CATEGORIES = ["social", "body", "creative", "adventure"] as const;
export type QuestCategory = (typeof QUEST_CATEGORIES)[number];

export const QuestSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(QUEST_CATEGORIES),
  est_minutes: z.number().int(),
  xp_value: z.number().int(),
});

export type GeneratedQuest = z.infer<typeof QuestSchema>;
