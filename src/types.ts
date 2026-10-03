// Core domain types. The single source of truth for the shape of a life.
// Logic lives in the other modules; this file only describes the data.

export type LifeStatus = "alive" | "hospital" | "dead";
export type Power = "nepa_off" | "gen_on" | "dark";

/** Soft meters, always kept in the 0..100 range. */
export interface Meters {
  hunger: number; // 0 = full, 100 = collapsing
  babe: number; // relationship standing
  flex: number; // social standing
  luck: number; // tilts every roll, 50 is neutral
}

export interface LogEntry {
  clock: number; // minutes since the run started
  text: string; // terse engine-side record; AI narration lives elsewhere
}

export interface GameState {
  day: number;
  clock: number; // minutes since 17:00 start
  cash: number; // naira
  fuel: number; // bars
  power: Power;
  meters: Meters;
  flags: Record<string, boolean>;
  status: LifeStatus;
  log: LogEntry[];
  rngState: number; // PRNG state, carried in state so runs are reproducible
}

/** A deterministic bundle of state changes. Missing keys mean "no change". */
export interface Effect {
  cash?: number;
  fuel?: number;
  hunger?: number;
  babe?: number;
  flex?: number;
  luck?: number;
  timeMins?: number; // advances the clock
  power?: Power;
  setFlags?: string[];
  status?: LifeStatus; // terminal override (hospital / dead)
}

/** What a choice requires to even be offered. A gate, not a deduction. */
export interface Cost {
  cash?: number;
  fuel?: number;
}

/** A luck-tilted gamble attached to a choice (the bet, snooker, the road). */
export interface Risk {
  baseChance: number; // 0..1 success probability before luck
  luckWeight?: number; // 0..1, how strongly luck tilts it (default 0.4)
  onWin: Effect;
  onLose: Effect;
}

/** A free-text money moment, e.g. the almajiri. The player types the amount. */
export interface FreeTextGift {
  kind: "gift";
  target: string;
}

export interface Choice {
  id: string;
  label: string;
  desc?: string;
  cost?: Cost; // requirement gate; all spending is expressed in `effect`
  effect?: Effect;
  risk?: Risk;
  freeText?: FreeTextGift;
}

export interface Scene {
  id: string;
  tags: string[]; // context + bias: home, road, rave, street, night, good, bad
  prompt: string; // the seed the AI narrates from
  choices: Choice[];
  weight?: number; // draw weight when this scene is in the deck
  once?: boolean; // draw at most once per run
  when?: (s: GameState) => boolean; // extra condition for eligibility
}

export type GiftTier = "nothing" | "stingy" | "fair" | "generous";

/** The record of what actually happened, handed to the AI to narrate.
 *  The AI reads this; it never produces it. */
export interface Resolution {
  choiceId: string;
  applied: Effect; // the deterministic effect that was applied
  risk?: { won: boolean; chance: number };
  gift?: { amount: number; tier: GiftTier };
  terminal?: LifeStatus; // set if this beat ended the run
  notes: string[];
}
