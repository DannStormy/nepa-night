// Offline tests for the narration contract. No network: they lock the prompt
// guardrails and the fallback narrator. The live Claude path is validated by
// running `npm run demo:voice` with a key, not in unit tests.

import { describe, it, expect } from "vitest";
import { TemplateNarrator } from "./template";
import { buildUserPrompt, SYSTEM } from "./prompt";
import { createInitialState } from "../state";
import type { NarrationRequest } from "./types";

const base = (over: Partial<NarrationRequest> = {}): NarrationRequest => ({
  scenePrompt: "NEPA don carry light.",
  choiceLabel: "Stake the 5,000 on sure-2-odds",
  resolution: { choiceId: "stake_bet", applied: {}, risk: { won: false, chance: 0.45 }, notes: [] },
  after: createInitialState("t"),
  ...over,
});

describe("narration contract", () => {
  it("orders the model to narrate, never decide", () => {
    expect(SYSTEM).toMatch(/never decide/i);
    expect(SYSTEM).toMatch(/2 to 4 sentences/i);
  });

  it("passes the engine's outcome into the prompt", () => {
    const p = buildUserPrompt(base());
    expect(p).toMatch(/busted/i);
    expect(p).toContain("Stake the 5,000");
  });
});

describe("template narrator (offline fallback)", () => {
  it("reflects a busted gamble without a network call", async () => {
    const line = await new TemplateNarrator().narrate(base());
    expect(line.toLowerCase()).toContain("bust");
    expect(line.length).toBeGreaterThan(0);
  });

  it("reflects a generous gift", async () => {
    const line = await new TemplateNarrator().narrate(
      base({
        choiceLabel: "Give her something",
        resolution: { choiceId: "give_something", applied: {}, gift: { amount: 1000, tier: "generous" }, notes: [] },
      }),
    );
    expect(line.toLowerCase()).toMatch(/hail|bless|thank/);
  });
});
