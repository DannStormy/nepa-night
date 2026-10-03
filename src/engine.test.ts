// Unit tests for the pure core. Runs with `npm test` (vitest). These lock the
// rules: deltas, gates, luck-tilted odds, free-text gifts, and terminal states.

import { describe, it, expect } from "vitest";
import { createInitialState, applyEffect, tickDecay, checkTerminal } from "./state";
import { canAfford, resolveChoice } from "./choices";
import { tierForGift } from "./freetext";
import { luckyChance } from "./rng";
import { GameEngine } from "./engine";
import { NEPA_NIGHT } from "./content/nepa-night";
import type { Choice } from "./types";

const find = (id: string): Choice => {
  const c = NEPA_NIGHT.choices.find((x) => x.id === id);
  if (!c) throw new Error(`missing choice ${id}`);
  return c;
};

describe("state", () => {
  it("starts on NEPA Night with 5k and 2 bars", () => {
    const s = createInitialState("seed-1");
    expect(s.cash).toBe(5000);
    expect(s.fuel).toBe(2);
    expect(s.meters.luck).toBe(50);
    expect(s.status).toBe("alive");
  });

  it("clamps meters to 0..100 and floors cash/fuel at 0", () => {
    const s = createInitialState("seed-1");
    const drained = applyEffect(s, { hunger: 999, cash: -999999, fuel: -999 });
    expect(drained.meters.hunger).toBe(100);
    expect(drained.cash).toBe(0);
    expect(drained.fuel).toBe(0);
  });

  it("sends you to hospital when hunger maxes out", () => {
    let s = createInitialState("seed-1");
    s = applyEffect(s, { hunger: 100 });
    expect(checkTerminal(s)).toBe("hospital");
  });

  it("wears hunger up and babe down as time passes", () => {
    const s = createInitialState("seed-1");
    const later = tickDecay(s, 120); // two hours
    expect(later.meters.hunger).toBeGreaterThan(s.meters.hunger);
    expect(later.meters.babe).toBeLessThan(s.meters.babe);
  });
});

describe("choices", () => {
  it("gates the bet: broke players can't stake 5k twice", () => {
    let s = createInitialState("seed-1");
    s = resolveChoice(s, find("buy_fuel")).state; // spends 3k
    expect(canAfford(s, find("stake_bet"))).toBe(false);
  });

  it("buy_fuel deducts cash and adds fuel exactly once", () => {
    const s = createInitialState("seed-1");
    const after = resolveChoice(s, find("buy_fuel")).state;
    expect(after.cash).toBe(2000);
    expect(after.fuel).toBe(4);
  });

  it("resolves the bet deterministically for a given seed", () => {
    const s = createInitialState("seed-1");
    const a = resolveChoice(s, find("stake_bet")).resolution;
    const b = resolveChoice(s, find("stake_bet")).resolution;
    expect(a.risk?.won).toBe(b.risk?.won); // same seed, same outcome
    expect(typeof a.risk?.chance).toBe("number");
  });
});

describe("luck", () => {
  it("raises the effective chance as luck climbs", () => {
    const [, , low] = luckyChance(123, 0.5, 10, 0.4);
    const [, , high] = luckyChance(123, 0.5, 90, 0.4);
    expect(high).toBeGreaterThan(low);
  });
});

describe("free-text gifts", () => {
  it("tiers amounts the way a beggar would read them", () => {
    expect(tierForGift(0)).toBe("nothing");
    expect(tierForGift(20)).toBe("stingy");
    expect(tierForGift(200)).toBe("fair");
    expect(tierForGift(1000)).toBe("generous");
  });
});

describe("engine", () => {
  it("offers the opening beat with affordable choices only", () => {
    const game = new GameEngine("seed-1");
    const beat = game.openingBeat();
    expect(beat.scene.id).toBe("nepa_night_open");
    expect(beat.choices.length).toBeGreaterThan(0);
    expect(game.alive).toBe(true);
  });
});
