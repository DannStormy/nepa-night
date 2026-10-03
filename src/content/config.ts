// Every tunable number lives here, kept out of the logic on purpose so
// balancing the game never means touching the engine.

import type { Meters, Power } from "../types";

/** Where a life begins on NEPA Night. */
export const START: {
  cash: number;
  fuel: number;
  power: Power;
  meters: Meters;
} = {
  cash: 5000,
  fuel: 2,
  power: "nepa_off",
  meters: { hunger: 35, babe: 60, flex: 45, luck: 50 },
};

/** How fast time wears you down, per hour passed. */
export const DECAY = {
  hungerPerHour: 6,
  babePerHour: 3,
};

/** The sure-2-odds bet. */
export const BET = {
  baseChance: 0.45,
  luckWeight: 0.4,
  payoutMultiple: 2.3,
};
