// Authored randomness. The "shit just keeps coming" feeling is a weighted draw
// from a finite, hand-written deck, filtered by context and biased by luck.
// Finite content, infinite-feeling nights.

import type { GameState, Scene } from "./types";
import { nextRandom } from "./rng";

export interface DrawContext {
  tags: string[]; // where we are right now: ["road","night"], ["rave"], ...
}

/**
 * Draw one eligible event, weighted, with luck bending the odds: low luck makes
 * "bad"-tagged events heavier, high luck favors "good" ones. Returns the picked
 * scene (or null if nothing is eligible) and the advanced rng state.
 */
export function drawEvent(
  state: GameState,
  deck: Scene[],
  context: DrawContext,
): { scene: Scene | null; rngState: number } {
  const pool = deck.filter(
    (e) =>
      e.tags.some((t) => context.tags.includes(t)) &&
      (!e.once || !state.flags[`seen:${e.id}`]) &&
      (!e.when || e.when(state)),
  );
  if (pool.length === 0) return { scene: null, rngState: state.rngState };

  const luckFactor = (state.meters.luck - 50) / 50; // -1..1
  const weighted = pool.map((e) => {
    let w = e.weight ?? 1;
    if (e.tags.includes("bad")) w *= Math.max(0.1, 1 - luckFactor * 0.5);
    if (e.tags.includes("good")) w *= Math.max(0.1, 1 + luckFactor * 0.5);
    return { scene: e, w };
  });

  const total = weighted.reduce((sum, x) => sum + x.w, 0);
  const [rngState, roll] = nextRandom(state.rngState);
  let target = roll * total;
  for (const { scene, w } of weighted) {
    target -= w;
    if (target <= 0) return { scene, rngState };
  }
  return { scene: weighted[weighted.length - 1]!.scene, rngState };
}
