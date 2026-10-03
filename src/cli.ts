// A tiny terminal harness to PLAY the NEPA Night loop before any AI narration
// or UI exists. It renders the engine's prompts raw and shows, in plain text,
// what each choice did, so you can feel the resource juggling and the luck.
//
// Run:  npm run play           (random seed)
//       npm run play -- 42     (fixed seed, reproducible night)

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { GameEngine } from "./engine";
import type { Choice, GameState, Resolution, Scene } from "./types";

const rl = readline.createInterface({ input, output });
const ask = async (q: string): Promise<string> => (await rl.question(q)).trim();
const line = (c = "-"): void => console.log(c.repeat(60));

function clock(mins: number): string {
  const total = 17 * 60 + mins;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function status(s: GameState): string {
  const m = s.meters;
  return [
    `₦${s.cash}`,
    `fuel ${s.fuel}`,
    s.power,
    `hunger ${Math.round(m.hunger)}`,
    `babe ${Math.round(m.babe)}`,
    `flex ${Math.round(m.flex)}`,
    `luck ${Math.round(m.luck)}`,
    clock(s.clock),
  ].join("  |  ");
}

/** Print numbered choices (+ an optional "0" escape) and return the picked
 *  index, or -1 for the escape option. */
async function askChoice(choices: Choice[], escape?: string): Promise<number> {
  choices.forEach((c, i) =>
    console.log(`  ${i + 1}. ${c.label}${c.desc ? "  (" + c.desc + ")" : ""}`),
  );
  if (escape) console.log(`  0. ${escape}`);
  for (;;) {
    const n = Number(await ask("\n> "));
    if (escape && n === 0) return -1;
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) return n - 1;
  }
}

function report(res: Resolution): void {
  const bits: string[] = [];
  if (res.risk) {
    const pct = Math.round(res.risk.chance * 100);
    bits.push(res.risk.won ? `e enter (${pct}%)` : `e bust (${pct}%)`);
  }
  if (res.gift) bits.push(`gave ₦${res.gift.amount}, she reads it as "${res.gift.tier}"`);
  if (res.terminal) bits.push(res.terminal.toUpperCase());
  if (bits.length) console.log(`   -> ${bits.join("  |  ")}`);
}

async function resolve(game: GameEngine, scene: Scene, choice: Choice): Promise<void> {
  let gift: number | undefined;
  if (choice.freeText?.kind === "gift") {
    gift = Math.max(0, Math.floor(Number(await ask("   how much you dey give? (naira): ")) || 0));
  }
  report(game.choose(scene, choice.id, gift));
}

async function homeNode(game: GameEngine): Promise<void> {
  const scene = game.openingBeat().scene;
  line();
  console.log(scene.prompt);
  const used = new Set<string>();
  while (game.alive) {
    const choices = game.openingBeat().choices.filter((c) => !used.has(c.id));
    if (choices.length === 0) break;
    console.log("\n" + status(game.state) + "\n");
    const idx = await askChoice(choices, "Step out into the night");
    if (idx === -1) break;
    const choice = choices[idx]!;
    await resolve(game, scene, choice);
    used.add(choice.id);
  }
}

async function wander(game: GameEngine): Promise<void> {
  let home = false;
  while (game.alive && !home) {
    line("=");
    console.log(status(game.state));
    console.log("\nWhere to?");
    console.log("  1. Hit the rave");
    console.log("  2. Waka the street");
    console.log("  3. Head home (the road)");
    console.log("  4. Just crash, end the night");
    const pick = await ask("\n> ");
    let tags: string[] | null = null;
    if (pick === "1") tags = ["rave"];
    else if (pick === "2") tags = ["street"];
    else if (pick === "3") ((tags = ["road", "night"]), (home = true));
    else if (pick === "4") break;
    else continue;

    const beat = game.nextBeat(tags);
    if (!beat) {
      console.log("\n(Quiet. Nothing jumps at you this time.)");
      continue;
    }
    line();
    console.log(beat.scene.prompt + "\n");
    if (beat.choices.length === 0) {
      console.log("(You can't afford to do anything here.)");
      continue;
    }
    const idx = await askChoice(beat.choices);
    await resolve(game, beat.scene, beat.choices[idx]!);
  }
}

function endCard(s: GameState): void {
  line("=");
  console.log("\nNEPA NIGHT  /  Day 1\n");
  let verdict: string;
  if (s.status === "hospital") verdict = "You collapsed. Woke up in a hospital bed. The night won.";
  else if (s.status === "dead") verdict = "You no make it home. Lagos no dey smile.";
  else if (s.flags["bet_won"]) verdict = "The bet hit. Fuel, chop, and change to spare. Rare W.";
  else if (s.flags["bet_played"]) verdict = "You staked am and lost. Dark room, empty belle, hard lesson.";
  else if (s.cash === 0) verdict = "You survived, but flat broke. Tomorrow starts hungry.";
  else verdict = "You made am through the night. Small small.";
  console.log(verdict + "\n");
  console.log(status(s) + "\n");
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  const game = new GameEngine(arg ?? Date.now());
  console.log("\n  N E P A   N I G H T   (slice harness)\n");
  await homeNode(game);
  if (game.alive) await wander(game);
  endCard(game.state);
  rl.close();
}

main().catch((e) => {
  console.error(e);
  rl.close();
  process.exit(1);
});
