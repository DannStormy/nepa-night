// Public API. Import from here, not from deep paths.

export * from "./types";
export { GameEngine } from "./engine";
export type { Beat } from "./engine";
export type { DrawContext } from "./events";

export { createInitialState, applyEffect, tickDecay, checkTerminal, clampMeter } from "./state";
export { resolveChoice, availableChoices, canAfford } from "./choices";
export { drawEvent } from "./events";
export { resolveGift, tierForGift } from "./freetext";
export { luckyChance, nextRandom, seedFrom } from "./rng";

export { START, DECAY, BET } from "./content/config";
export { NEPA_NIGHT } from "./content/nepa-night";
export { DECK } from "./content/deck";

export type { Narrator, NarrationRequest } from "./narrate";
export { createNarrator, TemplateNarrator, ClaudeNarrator, NARRATION_MODEL, SYSTEM, buildUserPrompt } from "./narrate";
