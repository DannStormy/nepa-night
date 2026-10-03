// Free-text money moments. The player types an amount; the engine decides how
// much can actually be given and how it lands, then hands a tier to the AI so
// it can voice the reaction. The words are the AI's; the money is the engine's.

import type { GameState, GiftTier } from "./types";
import { applyEffect } from "./state";

/** How a street beggar reads the amount you dropped. Tunable thresholds. */
export function tierForGift(amount: number): GiftTier {
  if (amount <= 0) return "nothing";
  if (amount < 100) return "stingy";
  if (amount < 500) return "fair";
  return "generous";
}

const LUCK_BY_TIER: Record<GiftTier, number> = {
  nothing: -2,
  stingy: 0,
  fair: 2,
  generous: 5,
};

/**
 * Resolve a typed gift. Caps the amount at what the player actually has,
 * deducts it, nudges luck as quiet karma, and returns the tier for narration.
 */
export function resolveGift(
  state: GameState,
  typedAmount: number,
): { state: GameState; amount: number; tier: GiftTier } {
  const amount = Math.max(0, Math.min(Math.floor(typedAmount || 0), state.cash));
  const tier = tierForGift(amount);
  const next = applyEffect(state, { cash: -amount, luck: LUCK_BY_TIER[tier] });
  return { state: next, amount, tier };
}
