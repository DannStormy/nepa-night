// An offline narrator. No API, no key, deterministic. Not as alive as the LLM,
// but it keeps the game runnable and the contract testable, and it doubles as a
// fallback if a narration call fails. Same inputs the real narrator gets.

import type { Narrator, NarrationRequest } from "./types";

const lower = (s: string): string => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export class TemplateNarrator implements Narrator {
  async narrate(req: NarrationRequest): Promise<string> {
    const r = req.resolution;
    const parts: string[] = [`You ${lower(req.choiceLabel)}.`];

    if (r.risk) parts.push(r.risk.won ? "E enter. For once, luck waka your side." : "E bust. Omo, hard luck.");

    if (r.gift) {
      if (r.gift.tier === "generous") parts.push("The pikin hail you well well.");
      else if (r.gift.tier === "fair") parts.push("Small blessing, she nods and moves.");
      else if (r.gift.tier === "stingy") parts.push('She hiss, "na this one?"');
      else parts.push("You waved am off. She remembers.");
    }

    if (r.terminal === "hospital") parts.push("Next thing you know, na hospital ceiling you dey look.");
    else if (r.terminal === "dead") parts.push("That was the last choice you ever made.");
    else if (req.after.power === "dark") parts.push("The room stay black, NEPA no send you.");

    return parts.join(" ");
  }
}
