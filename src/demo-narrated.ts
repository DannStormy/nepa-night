// Like `npm run demo`, but each beat is run through the narration layer so you
// hear the voice, not just the mechanics. Uses the offline TemplateNarrator by
// default; with ANTHROPIC_API_KEY set it uses the real Claude narrator.
//
// Run:  npm run demo:voice           (offline template voice)
//       ANTHROPIC_API_KEY=... npm run demo:voice   (real Claude narration)

import { GameEngine, type Beat } from "./engine";
import type { GameState, Resolution } from "./types";
import { createNarrator } from "./narrate";

const clock = (mins: number): string => {
  const t = 17 * 60 + mins;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
const status = (s: GameState): string =>
  `₦${s.cash} | fuel ${s.fuel} | ${s.power} | hunger ${Math.round(s.meters.hunger)} | babe ${Math.round(s.meters.babe)} | flex ${Math.round(s.meters.flex)} | ${clock(s.clock)}`;
const line = (c = "-"): void => console.log(c.repeat(60));
const pick = (beat: Beat, prefer: string[]): string | null => {
  for (const id of prefer) if (beat.choices.some((c) => c.id === id)) return id;
  return beat.choices[0]?.id ?? null;
};

async function main(): Promise<void> {
  const narrator = createNarrator();
  const usingAI = Boolean(process.env["ANTHROPIC_API_KEY"]);
  const game = new GameEngine(process.argv[2] ?? "lagos");

  console.log(`\n  N E P A   N I G H T   (${usingAI ? "Claude voice" : "offline template voice"})\n`);
  const open = game.openingBeat();
  line();
  console.log(open.scene.prompt);

  // helper: run a choice on a scene, then narrate what happened
  const play = async (scene: Beat["scene"], choiceId: string, gift?: number): Promise<void> => {
    const before = scene.prompt;
    const label = scene.choices.find((c) => c.id === choiceId)!.label;
    const res: Resolution = game.choose(scene, choiceId, gift);
    const voice = await narrator.narrate({
      scenePrompt: before,
      choiceLabel: label,
      resolution: res,
      after: game.state,
    });
    console.log(`\n  “${voice}”`);
    console.log("  " + status(game.state));
  };

  // Scripted opening moves.
  for (const id of ["stake_bet", "buy_chop", "gen_now"]) {
    const beat = game.openingBeat();
    if (!beat.choices.some((c) => c.id === id)) continue;
    await play(beat.scene, id);
  }

  // Wander a few stops.
  const stops: { where: string; tags: string[]; prefer: string[]; gift?: number }[] = [
    { where: "the rave", tags: ["rave"], prefer: ["play_snooker"] },
    { where: "the street", tags: ["street"], prefer: ["give_something"], gift: 50 },
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
    const id = pick(beat, stop.prefer);
    if (!id) continue;
    await play(beat.scene, id, stop.gift);
  }

  line("=");
  const s = game.state;
  const verdict = s.flags["bet_won"]
    ? "The bet hit. Rare W."
    : s.status !== "alive"
      ? "The night won."
      : s.cash === 0
        ? "Survived, but broke."
        : "You made am through. Small small.";
  console.log(`\nNEPA NIGHT / Day 1\n${verdict}\n${status(s)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
