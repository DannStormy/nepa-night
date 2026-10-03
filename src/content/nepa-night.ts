// The opening node. Decisions A..E from the spec, encoded as data. `prompt` is
// the seed the AI narrates from; the labels and descriptions are the menu the
// player sees. All spending is in `effect`; `cost` only gates availability.

import type { Scene } from "../types";
import { BET } from "./config";

export const NEPA_NIGHT: Scene = {
  id: "nepa_night_open",
  tags: ["home", "evening"],
  prompt:
    "5pm. NEPA has taken light since afternoon. Fan off, room warm, phone at 40%, " +
    "not eaten since morning. Babe just texted asking for something. 5,000 naira in " +
    "the wallet, 2 bars of fuel in the gen. Night never reach, so running the gen now " +
    "feels like waste.",
  choices: [
    // A. Power
    {
      id: "gen_now",
      label: "Put on the gen now",
      desc: "Light and a fan, but you burn fuel you'll beg for by 9pm.",
      cost: { fuel: 1 },
      effect: {
        fuel: -1,
        hunger: -5,
        flex: 2,
        timeMins: 30,
        power: "gen_on",
        setFlags: ["gen_on"],
      },
    },
    {
      id: "endure_heat",
      label: "Endure the heat",
      desc: "Save the fuel for when it truly matters.",
      effect: { hunger: 4, flex: -1, timeMins: 60, power: "dark" },
    },
    // B. The 5k
    {
      id: "buy_fuel",
      label: "Buy fuel (3,000)",
      desc: "Night light secured. 2k left, hunger and babe still waiting.",
      cost: { cash: 3000 },
      effect: { cash: -3000, fuel: 2, timeMins: 30 },
    },
    {
      id: "buy_chop",
      label: "Buy chop (1,500)",
      desc: "Belle full, head clear.",
      cost: { cash: 1500 },
      effect: { cash: -1500, hunger: -30, timeMins: 30, setFlags: ["ate"] },
    },
    {
      id: "send_babe",
      label: "Send babe 2,000",
      desc: "Peace at home, but that's fuel or food money gone.",
      cost: { cash: 2000 },
      effect: { cash: -2000, babe: 18, timeMins: 15 },
    },
    // C. The bet
    {
      id: "stake_bet",
      label: "Stake the 5,000 on sure-2-odds",
      desc: "If e enter, money plenty. If e bust, you don enter am.",
      cost: { cash: 5000 },
      effect: { cash: -5000, timeMins: 30, setFlags: ["bet_played"] },
      risk: {
        baseChance: BET.baseChance,
        luckWeight: BET.luckWeight,
        onWin: { cash: Math.round(5000 * BET.payoutMultiple), flex: 8, setFlags: ["bet_won"] },
        onLose: { flex: -6 },
      },
    },
  ],
};
