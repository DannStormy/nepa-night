// The real voice. Sends the engine's decided beat to Claude and gets back Naija
// prose. The system prompt forbids the model from changing any outcome, so this
// stays a narrator, never a game master.

import Anthropic from "@anthropic-ai/sdk";
import type { Narrator, NarrationRequest } from "./types";
import { SYSTEM, buildUserPrompt } from "./prompt";

/**
 * Narration runs once per beat, and the monetization model is built on keeping
 * per-beat token cost low (see the spec). Haiku 4.5 by choice. Raise this one
 * line to a stronger model for big set-piece moments if you want.
 */
export const NARRATION_MODEL = "claude-haiku-4-5";

export class ClaudeNarrator implements Narrator {
  private client: Anthropic;
  private model: string;

  constructor(opts: { client?: Anthropic; model?: string } = {}) {
    // Zero-arg client reads ANTHROPIC_API_KEY, or an `ant auth login` profile.
    this.client = opts.client ?? new Anthropic();
    this.model = opts.model ?? NARRATION_MODEL;
  }

  async narrate(req: NarrationRequest): Promise<string> {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 220,
      temperature: 0.85, // voice can vary; the facts are pinned in the prompt
      system: SYSTEM,
      messages: [{ role: "user", content: buildUserPrompt(req) }],
    });
    return msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  }
}
