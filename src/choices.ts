// Turning a chosen option into an outcome. `cost` is only a gate (can you
// pick this?); all spending is expressed in the choice's `effect`, so nothing
// is ever deducted twice. Resolution records what happened for the AI to voice.

import type { Choice, Effect, GameState, Resolution } from "./types";
import { applyEffect, checkTerminal, tickDecay } from "./state";
import { luckyChance } from "./rng";
import { resolveGift } from "./freetext";

/** Can the player afford to even choose this? */
export function canAfford(state: GameState, choice: Choice): boolean {
  const c = choice.cost;
  if (!c) return true;
  return state.cash >= (c.cash ?? 0) && state.fuel >= (c.fuel ?? 0);
}

/** The affordable subset of a scene's choices. */
export function availableChoices(state: GameState, choices: Choice[]): Choice[] {
  return choices.filter((ch) => canAfford(state, ch));
}

/**
 * Resolve a choice into a new state and a Resolution.
 * Order: free-text gift, deterministic effect, luck-tilted risk, time decay,
 * terminal check.
 */
export function resolveChoice(
  state: GameState,
  choice: Choice,
  giftAmount?: number,
): { state: GameState; resolution: Resolution } {
  const notes: string[] = [];
  let s = state;

  // Free-text gift (the almajiri).
  let gift: Resolution["gift"];
  if (choice.freeText?.kind === "gift") {
    const res = resolveGift(s, giftAmount ?? 0);
    s = res.state;
    gift = { amount: res.amount, tier: res.tier };
    notes.push(`gift:${res.tier}:${res.amount}`);
  }

  // Deterministic effect.
  const applied: Effect = choice.effect ? { ...choice.effect } : {};
  if (choice.effect) s = applyEffect(s, choice.effect);

  // Luck-tilted risk.
  let risk: Resolution["risk"];
  if (choice.risk) {
    const [rngState, won, chance] = luckyChance(
      s.rngState,
      choice.risk.baseChance,
      s.meters.luck,
      choice.risk.luckWeight,
    );
    s = { ...s, rngState };
    s = applyEffect(s, won ? choice.risk.onWin : choice.risk.onLose);
    risk = { won, chance };
    notes.push(won ? "risk:won" : "risk:lost");
  }

  // Time wear based on the beat's own duration, then terminal rules.
  s = tickDecay(s, choice.effect?.timeMins ?? 0);
  const status = checkTerminal(s);
  if (status !== s.status) s = { ...s, status };

  return {
    state: s,
    resolution: {
      choiceId: choice.id,
      applied,
      risk,
      gift,
      terminal: s.status !== "alive" ? s.status : undefined,
      notes,
    },
  };
}
