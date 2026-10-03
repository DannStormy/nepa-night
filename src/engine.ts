// The orchestrator. A thin, stateful shell over the pure functions: it holds
// the current life, hands out beats, and applies choices. The AI layer reads
// `state` and the returned Resolution to narrate; it never touches state here.

import type { Choice, GameState, Resolution, Scene } from "./types";
import { createInitialState } from "./state";
import { availableChoices, resolveChoice } from "./choices";
import { drawEvent } from "./events";
import { NEPA_NIGHT } from "./content/nepa-night";
import { DECK } from "./content/deck";

/** A single moment put to the player: a scene and the choices they can afford. */
export interface Beat {
  scene: Scene;
  choices: Choice[];
}

export class GameEngine {
  state: GameState;
  private deck: Scene[];

  constructor(seed?: number | string, deck: Scene[] = DECK) {
    this.state = createInitialState(seed);
    this.deck = deck;
  }

  /** The fixed opening beat of the slice. */
  openingBeat(): Beat {
    return {
      scene: NEPA_NIGHT,
      choices: availableChoices(this.state, NEPA_NIGHT.choices),
    };
  }

  /** Draw an emergent beat for the current context, e.g. leaving the house. */
  nextBeat(contextTags: string[]): Beat | null {
    const { scene, rngState } = drawEvent(this.state, this.deck, { tags: contextTags });
    this.state = { ...this.state, rngState };
    if (!scene) return null;
    this.state = {
      ...this.state,
      flags: { ...this.state.flags, [`seen:${scene.id}`]: true },
    };
    return { scene, choices: availableChoices(this.state, scene.choices) };
  }

  /** Apply a choice from a scene. `giftAmount` is used only by free-text beats. */
  choose(scene: Scene, choiceId: string, giftAmount?: number): Resolution {
    const choice = scene.choices.find((c) => c.id === choiceId);
    if (!choice) throw new Error(`Unknown choice "${choiceId}" in scene "${scene.id}"`);
    const { state, resolution } = resolveChoice(this.state, choice, giftAmount);
    this.state = state;
    return resolution;
  }

  get alive(): boolean {
    return this.state.status === "alive";
  }
}
