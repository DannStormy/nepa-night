// The narration contract, as a prompt. This is the guardrail that keeps the AI
// a narrator and not a game master: it is told what already happened and ordered
// to honor it exactly. All outcome facts come from the engine's Resolution.

import type { NarrationRequest } from "./types";
import type { GameState } from "../types";

export const SYSTEM = `You are the narrator of a Lagos survival life-sim.

Voice: authentic Nigerian English and pidgin, streetwise, calm, darkly funny, grounded. Never corny, never a tourist, never over-explaining. Short and vivid.

Hard rules you never break:
- You NARRATE what already happened. The game engine has decided every outcome, number, win, loss, and whether the player lived or died. You never decide, change, soften, or invent any of that.
- Do not state stat numbers or naira amounts. Render the feeling, not the spreadsheet.
- Write 2 to 4 sentences. Second person ("you"). Present tense.
- If told the gamble busted, it busted. If told they collapsed, they collapsed. Honor the outcome exactly.
- No lists, no headings, no meta commentary, no emojis, no dashes. Just the moment.`;

function mood(s: GameState): string[] {
  const m = s.meters;
  const t = 17 * 60 + s.clock;
  const bits: string[] = [];
  if (t >= 21 * 60) bits.push("it is deep into the night");
  else if (t >= 19 * 60) bits.push("the evening has gone dark");
  if (s.power === "dark") bits.push("no light, the room is pitch black");
  else if (s.power === "gen_on") bits.push("the gen is humming outside");
  if (s.cash <= 0) bits.push("you are flat broke");
  if (m.hunger >= 70) bits.push("hunger is biting hard");
  if (m.babe <= 25) bits.push("your babe is vex");
  return bits;
}

function outcomeFacts(req: NarrationRequest): string[] {
  const r = req.resolution;
  const f: string[] = [];
  if (r.risk) f.push(r.risk.won ? "The gamble came through, it worked." : "The gamble failed, it busted.");
  if (r.gift) {
    const byTier: Record<string, string> = {
      nothing: "You ended up giving nothing.",
      stingy: `You dropped an insulting-small amount (${r.gift.amount} naira).`,
      fair: `You gave a fair amount (${r.gift.amount} naira).`,
      generous: `You gave generously (${r.gift.amount} naira).`,
    };
    const s = byTier[r.gift.tier];
    if (s) f.push(s);
  }
  if (r.terminal === "hospital") f.push("This ended with you collapsing and waking up in a hospital.");
  if (r.terminal === "dead") f.push("This ended with your death.");
  return f;
}

export function buildUserPrompt(req: NarrationRequest): string {
  const facts = outcomeFacts(req);
  const m = mood(req.after);
  return [
    `Situation: ${req.scenePrompt}`,
    `The player chose: ${req.choiceLabel}`,
    facts.length
      ? `What actually happened, honor this exactly: ${facts.join(" ")}`
      : `What actually happened: the choice played out plainly, no dramatic twist.`,
    m.length ? `Mood and context right now: ${m.join(", ")}.` : "",
    `Narrate this beat now, 2 to 4 sentences.`,
  ]
    .filter(Boolean)
    .join("\n");
}
