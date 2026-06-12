import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { QuestSchema, type GeneratedQuest } from "./schema";
import { buildSystemPrompt, buildUserContext, type QuestContext } from "./prompt";

export interface GenerateDeps {
  client: Anthropic;
}

export async function generateQuest(ctx: QuestContext, deps: GenerateDeps = { client: new Anthropic() }): Promise<GeneratedQuest> {
  const response = await deps.client.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserContext(ctx) }],
    output_config: { format: zodOutputFormat(QuestSchema) },
  });
  if (!response.parsed_output) {
    throw new Error("Quest generation returned no structured output");
  }
  return response.parsed_output;
}
