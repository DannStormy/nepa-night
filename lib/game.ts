// Server-only glue between the engine and the web route. Turns engine scenes
// into wire-friendly beats and reads a verdict off a finished run.

import {
  NEPA_NIGHT,
  DECK,
  availableChoices,
  type GameState,
  type Scene,
  type Choice,
} from "@/src/index";
import type { ClientBeat, ClientChoice } from "@/lib/types";

export function sceneById(id: string): Scene | null {
  if (id === NEPA_NIGHT.id) return NEPA_NIGHT;
  return DECK.find((s) => s.id === id) ?? null;
}

const toClient = (c: Choice): ClientChoice => ({
  id: c.id,
  label: c.label,
  desc: c.desc,
  gift: c.freeText?.kind === "gift",
});

/** The home node, showing only affordable choices not already taken this run. */
export function homeBeat(state: GameState): ClientBeat {
  const choices = availableChoices(state, NEPA_NIGHT.choices).filter(
    (c) => !state.flags[`usedHome:${c.id}`],
  );
  return { sceneId: NEPA_NIGHT.id, prompt: NEPA_NIGHT.prompt, choices: choices.map(toClient) };
}

export function eventBeat(scene: Scene, state: GameState): ClientBeat {
  return {
    sceneId: scene.id,
    prompt: scene.prompt,
    choices: availableChoices(state, scene.choices).map(toClient),
  };
}

export function verdict(s: GameState): string {
  if (s.status === "hospital") return "You collapsed. Woke up in a hospital bed. The night won.";
  if (s.status === "dead") return "You no make it home. Lagos no dey smile.";
  if (s.flags["bet_won"]) return "The bet hit. Fuel, chop, and change to spare. Rare W.";
  if (s.flags["bet_played"]) return "You staked am and lost. Dark room, empty belle, hard lesson.";
  if (s.cash === 0) return "You survived, but flat broke. Tomorrow starts hungry.";
  return "You made am through the night. Small small.";
}
