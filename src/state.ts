// Pure state helpers: create a life, apply a deterministic effect, let time
// wear it down, and check the hard terminal rules. Every function returns a
// new state and mutates nothing.

import type { Effect, GameState, LifeStatus, Meters } from "./types";
import { START, DECAY } from "./content/config";
import { seedFrom } from "./rng";

const METER_KEYS = ["hunger", "babe", "flex", "luck"] as const;

export function createInitialState(seed: number | string = Date.now()): GameState {
  return {
    day: 1,
    clock: 0,
    cash: START.cash,
    fuel: START.fuel,
    power: START.power,
    meters: { ...START.meters },
    flags: {},
    status: "alive",
    log: [],
    rngState: seedFrom(seed),
  };
}

export function clampMeter(v: number): number {
  return v < 0 ? 0 : v > 100 ? 100 : v;
}

/** Apply a deterministic effect. Pure: returns a fresh state. */
export function applyEffect(state: GameState, effect: Effect): GameState {
  const meters: Meters = { ...state.meters };
  for (const k of METER_KEYS) {
    const delta = effect[k];
    if (typeof delta === "number") meters[k] = clampMeter(meters[k] + delta);
  }

  const next: GameState = {
    ...state,
    meters,
    cash: Math.max(0, state.cash + (effect.cash ?? 0)),
    fuel: Math.max(0, state.fuel + (effect.fuel ?? 0)),
    clock: state.clock + (effect.timeMins ?? 0),
    power: effect.power ?? state.power,
    flags: { ...state.flags },
    status: effect.status ?? state.status,
  };

  for (const flag of effect.setFlags ?? []) next.flags[flag] = true;
  return next;
}

/** Time passing wears you down. Call with the minutes a beat consumed. */
export function tickDecay(state: GameState, mins: number): GameState {
  if (mins <= 0) return state;
  const hours = mins / 60;
  return {
    ...state,
    meters: {
      ...state.meters,
      hunger: clampMeter(state.meters.hunger + DECAY.hungerPerHour * hours),
      babe: clampMeter(state.meters.babe - DECAY.babePerHour * hours),
    },
  };
}

/** Terminal rules the engine enforces. The AI never decides life or death. */
export function checkTerminal(state: GameState): LifeStatus {
  if (state.status !== "alive") return state.status;
  if (state.meters.hunger >= 100) return "hospital"; // you collapse, not die
  return "alive";
}
