import type { QuestCategory } from "./schema";

export function buildSystemPrompt(): string {
  return [
    "You are SideQuest, a playful game master that invents ONE small real-life side quest",
    "to make the player's day more varied and fun.",
    "Rules:",
    "- The quest must take 5 to 15 minutes. Never require travel far or spending much money.",
    "- It must be concrete and doable today, alone, wherever the player is.",
    "- Pick exactly one category from the allowed set the player gives you.",
    "- Avoid repeating the player's recent quests.",
    "- title: short and inviting. description: 1-2 sentences, second person, encouraging.",
    "- est_minutes: 5-15. xp_value: 10-25 based on effort.",
  ].join("\n");
}

export interface QuestContext {
  city: string | null;
  weather: string | null;
  mood: string | null;
  categories: QuestCategory[];
  recentTitles: string[];
}

export function buildUserContext(ctx: QuestContext): string {
  const lines = [
    `Location: ${ctx.city ?? "unknown"}`,
    `Weather: ${ctx.weather ?? "unknown"}`,
    `Mood today: ${ctx.mood ?? "unspecified"}`,
    `Allowed categories: ${ctx.categories.join(", ")}`,
    ctx.recentTitles.length ? `Recent quests to avoid repeating: ${ctx.recentTitles.join("; ")}` : "No recent quests yet.",
    "Invent today's side quest now.",
  ];
  return lines.join("\n");
}
