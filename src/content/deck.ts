// The emergent event deck. The engine draws from this by context tag and luck
// to make nights feel unpredictable from finite, tunable content. This is where
// most future authoring happens: add cards, tag them, weight them.
//
// Tags: context (home, road, rave, street, night) and bias (good, bad).

import type { Scene } from "../types";

export const DECK: Scene[] = [
  {
    id: "rave_snooker",
    tags: ["rave"],
    weight: 3,
    prompt: "Inside the rave, a guy you know waves you to the snooker table. Small bet dey.",
    choices: [
      {
        id: "play_snooker",
        label: "Rack up, play for money",
        desc: "Win some or lose some.",
        cost: { cash: 1000 },
        effect: { timeMins: 45, flex: 3 },
        risk: {
          baseChance: 0.5,
          luckWeight: 0.5,
          onWin: { cash: 2000, flex: 5 },
          onLose: { cash: -1000, flex: -2 },
        },
      },
      { id: "watch_snooker", label: "Just watch", desc: "Keep your money.", effect: { timeMins: 20 } },
    ],
  },
  {
    id: "rave_round",
    tags: ["rave"],
    weight: 2,
    prompt: "The vibe peaks. Overdrunk you, feeling like a big man, eyes the whole bar.",
    choices: [
      {
        id: "buy_round",
        label: "Buy everybody beer",
        desc: "Legend for one night, if the money can carry it.",
        cost: { cash: 3000 },
        effect: { cash: -3000, flex: 20, babe: -2, timeMins: 30, setFlags: ["bought_round"] },
      },
      { id: "hold_money", label: "Hold your money", desc: "Enjoy quietly.", effect: { flex: 1, timeMins: 20 } },
    ],
  },
  {
    id: "road_home_danger",
    tags: ["road", "night", "bad"],
    weight: 2,
    when: (s) => s.clock >= 240, // late enough for the bridge to be empty
    prompt: "Third Mainland, late and near empty. Headlights rush up behind you, too fast.",
    choices: [
      {
        id: "speed_off",
        label: "Gun it, get home fast",
        desc: "Outrun whatever that is. Risky at this speed.",
        effect: { timeMins: 20 },
        risk: {
          baseChance: 0.7,
          luckWeight: 0.6,
          onWin: { flex: 4, setFlags: ["got_home_safe"] },
          onLose: { status: "hospital", cash: -2000, setFlags: ["accident"] },
        },
      },
      {
        id: "stay_calm",
        label: "Slow down, stay calm",
        desc: "Let them pass. Or let them reach you.",
        effect: { timeMins: 40 },
        risk: {
          baseChance: 0.6,
          luckWeight: 0.7,
          onWin: { setFlags: ["got_home_safe"] },
          onLose: { cash: -4000, setFlags: ["robbed"] },
        },
      },
    ],
  },
  {
    id: "almajiri",
    tags: ["street", "road"],
    weight: 3,
    prompt: "A small almajiri tugs your sleeve at the junction. 'Oga how far, abeg give me something.'",
    choices: [
      {
        id: "give_something",
        label: "Give her something",
        desc: "Type what you want to drop.",
        freeText: { kind: "gift", target: "almajiri" },
        effect: { timeMins: 5 },
      },
      { id: "wave_off", label: "Wave her off", desc: "Keep moving.", effect: { luck: -2, timeMins: 2 } },
    ],
  },
  {
    id: "rain_splash",
    tags: ["road", "street", "bad"],
    weight: 1,
    prompt: "Rain dey fall. A danfo tears toward a puddle right beside you.",
    choices: [
      {
        id: "dodge_splash",
        label: "Try to dodge",
        desc: "Maybe you save the outfit.",
        effect: { timeMins: 5 },
        risk: {
          baseChance: 0.5,
          luckWeight: 0.8,
          onWin: { flex: 2 },
          onLose: { flex: -6, babe: -2, setFlags: ["soaked"] },
        },
      },
    ],
  },
];
