// The only server endpoint. It owns the engine and the narrator; the browser
// just holds the serializable state and posts each turn back. The API key stays
// here, never shipped to the client.

import {
  createInitialState,
  resolveChoice,
  drawEvent,
  DECK,
  createNarrator,
  type GameState,
} from "@/src/index";
import { homeBeat, eventBeat, sceneById, verdict } from "@/lib/game";

export const runtime = "nodejs"; // the Anthropic SDK needs the Node runtime

// Claude when ANTHROPIC_API_KEY is set (server-side), otherwise the offline template.
const narrator = createNarrator();

export async function POST(req: Request): Promise<Response> {
  const body = await req.json();
  const action: string = body.action;

  if (action === "start") {
    const state = createInitialState(body.seed ?? Date.now());
    return Response.json({ state, beat: homeBeat(state), narration: null, ended: false });
  }

  if (action === "chooseHome" || action === "chooseEvent") {
    const state = body.state as GameState;
    const scene = sceneById(body.sceneId);
    const choice = scene?.choices.find((c) => c.id === body.choiceId);
    if (!scene || !choice) return Response.json({ error: "unknown scene or choice" }, { status: 400 });

    const { state: resolved, resolution } = resolveChoice(state, choice, body.gift);
    let s = resolved;
    if (action === "chooseHome") {
      s = { ...s, flags: { ...s.flags, [`usedHome:${choice.id}`]: true } };
    }

    const narration = await narrator.narrate({
      scenePrompt: scene.prompt,
      choiceLabel: choice.label,
      resolution,
      after: s,
    });

    const ended = s.status !== "alive" || Boolean(body.heading);
    const beat = action === "chooseHome" && !ended ? homeBeat(s) : null;
    return Response.json({ state: s, narration, beat, ended, verdict: ended ? verdict(s) : null });
  }

  if (action === "wander") {
    const state = body.state as GameState;
    const { scene, rngState } = drawEvent(state, DECK, { tags: body.tags ?? [] });
    let s: GameState = { ...state, rngState };

    if (!scene) {
      const ended = Boolean(body.heading);
      return Response.json({ state: s, beat: null, narration: null, ended, verdict: ended ? verdict(s) : null });
    }

    s = { ...s, flags: { ...s.flags, [`seen:${scene.id}`]: true } };
    return Response.json({ state: s, beat: eventBeat(scene, s), narration: null, ended: false });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
