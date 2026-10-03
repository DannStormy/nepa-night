// The narration layer's contract. A Narrator turns an engine-decided beat into
// prose. It reads the outcome; it never produces or changes it.

import type { GameState, Resolution } from "../types";

export interface NarrationRequest {
  scenePrompt: string; // the situation the player faced
  choiceLabel: string; // what they chose to do
  resolution: Resolution; // what the engine already decided (the source of truth)
  after: GameState; // the resulting state, for mood and context only
}

export interface Narrator {
  /** Render the beat as 2-4 sentences of Naija-voice prose. Pure output; no state change. */
  narrate(req: NarrationRequest): Promise<string>;
}
