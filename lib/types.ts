// Shapes crossing the wire between the browser and the server route. Type-only,
// so the client can import these without pulling the engine or the SDK.

import type { GameState } from "@/src/types";

export interface ClientChoice {
  id: string;
  label: string;
  desc?: string;
  gift?: boolean; // a free-text money moment: the player types an amount
}

export interface ClientBeat {
  sceneId: string;
  prompt: string;
  choices: ClientChoice[];
}

export interface TurnResponse {
  state: GameState;
  beat: ClientBeat | null;
  narration: string | null;
  ended: boolean;
  verdict?: string | null;
}
