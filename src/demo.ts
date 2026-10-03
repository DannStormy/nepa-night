// A non-interactive, scripted playthrough so a whole night can be SHOWN in one
// shot. This drives the engine directly (no readline), auto-picking choices, so
// it prints cleanly to a log. The real, playable version is `npm run play`.
//
// Run:  npm run demo            (seed "lagos")
//       npm run demo -- 42      (any seed)

import { GameEngine, type Beat } from "./engine";
import type { GameState, Resolution } from "./types";

const clock = (mins: number): string => {
  const t = 17 * 60 + mins;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

const status = (s: GameState): string =>
  [
    `₦${s.cash}`,
    `fuel ${s.fuel}`,
    s.power,
    `hunger ${Math.round(s.meters.hunger)}`,
    `babe ${Math.round(s.meters.babe)}`,
    `flex ${Math.round(s.meters.flex)}`,
    `luck ${Math.round(s.meters.luck)}`,
    clock(s.clock),
  ].join("  |  ");

const line = (c = "-"): void => console.log(c.repeat(60));

function showRes(r: Resolution): void {
  const b: string[] = [];
  if (r.risk) b.push(r.risk.won ? `e enter (${Math.round(r.risk.chance * 100)}%)` : `e bust (${Math.round(r.risk.chance * 100)}%)`);
  if (r.gift) b.push(`gave ₦${r.gift.amount}, read as "${r.gift.tier}"`);
  if (r.terminal) b.push(r.terminal.toUpperCase());
  if (b.length) console.log(`   -> ${b.join("  |  ")}`);
}

/** Pick a preferred affordable choice from a beat, else the first affordable one. */
function pick(beat: Beat, prefer: string[]): string | null {
  for (const id of prefer) if (beat.choices.some((c) => c.id === id)) return id;
  return beat.choices[0]?.id ?? null;
}

const game = new GameEngine(process.argv[2] ?? "lagos");
console.log("\n  N E P A   N I G H T   (scripted demo)\n");

const open = game.openingBeat();
line();
console.log(open.scene.prompt);
console.log("\n" + status(game.state));

// Scripted opening moves, skipped automatically if unaffordable.
for (const id of ["stake_bet", "buy_chop", "gen_now"]) {
  const beat = game.openingBeat();
  const choice = beat.choices.find((c) => c.id === id);
  if (!choice) continue;
  console.log(`\n> ${choice.label}`);
  showRes(game.choose(beat.scene, id));
  console.log(status(game.state));
}

// Step out and wander; auto-pick an interesting move at each stop.
const stops: { where: string; tags: string[]; prefer: string[]; gift?: number }[] = [
  { where: "the rave", tags: ["rave"], prefer: ["play_snooker"] },
  { where: "the rave", tags: ["rave"], prefer: ["buy_round", "hold_money"] },
  { where: "the street", tags: ["street"], prefer: ["give_something"], gift: 200 },
  { where: "the road home", tags: ["road", "night"], prefer: ["speed_off", "dodge_splash", "give_something"], gift: 100 },
];

for (const stop of stops) {
  if (!game.alive) break;
  const beat = game.nextBeat(stop.tags);
  line("=");
  console.log(`You waka reach ${stop.where}.`);
  if (!beat) {
    console.log("(Quiet. Nothing jumps at you.)");
    continue;
  }
  console.log("\n" + beat.scene.prompt);
  const id = pick(beat, stop.prefer);
  if (!id) {
    console.log("(Can't afford anything here.)");
    continue;
  }
  const label = beat.choices.find((c) => c.id === id)!.label;
  console.log(`\n> ${label}`);
  showRes(game.choose(beat.scene, id, stop.gift));
  console.log(status(game.state));
}

// The verdict card.
line("=");
console.log("\nNEPA NIGHT  /  Day 1\n");
const s = game.state;
let v: string;
if (s.status === "hospital") v = "You collapsed. Woke up in a hospital bed. The night won.";
else if (s.status === "dead") v = "You no make it home. Lagos no dey smile.";
else if (s.flags["bet_won"]) v = "The bet hit. Fuel, chop, and change to spare. Rare W.";
else if (s.flags["bet_played"]) v = "You staked am and lost. Dark room, empty belle, hard lesson.";
else if (s.cash === 0) v = "You survived, but flat broke. Tomorrow starts hungry.";
else v = "You made am through the night. Small small.";
console.log(v + "\n\n" + status(s) + "\n");
