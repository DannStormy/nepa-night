// Public surface for the narration layer.

import type { Narrator } from "./types";
import { TemplateNarrator } from "./template";
import { ClaudeNarrator } from "./claude";

export type { Narrator, NarrationRequest } from "./types";
export { SYSTEM, buildUserPrompt } from "./prompt";
export { TemplateNarrator } from "./template";
export { ClaudeNarrator, NARRATION_MODEL } from "./claude";

/**
 * Choose a narrator: the real Claude voice when an API key is present, the
 * offline template otherwise, so the game always runs. Pass `ai` to force it.
 */
export function createNarrator(opts: { ai?: boolean } = {}): Narrator {
  const useAI = opts.ai ?? Boolean(process.env["ANTHROPIC_API_KEY"]);
  return useAI ? new ClaudeNarrator() : new TemplateNarrator();
}
