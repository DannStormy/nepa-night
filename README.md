# NEPA Night

A text survival game set in Lagos, built as a study in one problem: how do you put an LLM inside a product without letting it lie?

The interesting part is not the game. It is the architecture. A deterministic engine owns every outcome, and an LLM only ever puts the engine's already-decided outcome into voice. The model narrates. It never decides, and it never holds the truth.

## The core idea

Most "AI game" or "AI chat" builds hand the model the whole state and ask it to both decide what happens and describe it. That reads well until it invents a number, flips an outcome, or contradicts itself three turns later. The failure is not the prompt. It is that the model was given authority it should never have had.

NEPA Night splits those jobs cleanly:

- **The engine decides.** Money, fuel, hunger, risk, the event deck, the dice. All of it is pure, seeded, and deterministic. The same seed replays the same run, exactly.
- **The narrator describes.** It receives a small set of already-resolved facts (the result, the meter deltas, a mood tag) and a hard contract: render these facts in voice, introduce nothing new. No fresh numbers, no new outcomes.

If the model fails or the API is down, an offline template narrator takes over, so a failure degrades to correct-but-plain text instead of a confident wrong story.

## Architecture

```
src/
  types.ts         domain types (GameState, Meters, Effect, Cost, Risk, Choice, Scene, Resolution)
  rng.ts           seeded mulberry32 RNG; luck tilts every roll
  state.ts         state transitions (applyEffect, tickDecay, checkTerminal)
  choices.ts       affordability gates + choice resolution (cost is a gate, spend lives in the effect)
  events.ts        weighted event draw (tags + luck)
  engine.ts        GameEngine: openingBeat / nextBeat / choose
  freetext.ts      free-text player input (e.g. what to hand an almajiri)
  content/         config, the opening scene, the event deck (data, not logic)
  narrate/
    prompt.ts      the contract that forbids the model from deciding or changing any outcome
    claude.ts      ClaudeNarrator (Anthropic SDK)
    template.ts    offline fallback narrator
    index.ts       picks Claude if an API key is present, else template
  index.ts         public API
```

Logic is kept separate from content and from narration on purpose. The engine has no idea an LLM exists. The narrator has no power to change the game. You can run, test, and reason about either one without the other.

## The design rule, stated plainly

When an LLM sits inside a product, most "prompt bugs" are really authority and context bugs. Decide what the model is allowed to know and what it is allowed to say, keep the truth in code, and make failure degrade safely.

## Verifying it holds

The engine is deterministic, so it is testable like any pure system. The narration layer is tested against the same bar: run the engine to a known outcome, assert the narrator only ever reflects the facts it was handed and never introduces a result the engine did not produce.

```bash
npm install
npm test          # unit tests: engine + narration contract
npm run typecheck # strict TS, no emit
```

14 tests covering the engine and the narration contract, all green.

## Running it

```bash
npm run play        # interactive CLI
npm run demo        # scripted, non-interactive run
npm run demo:voice  # narrated run (template narrator, no key needed)
npm run dev         # web UI (Next.js app router)
```

For live Claude narration, set `ANTHROPIC_API_KEY`. Without it, the template narrator runs and everything still works.

## Stack

TypeScript (strict), framework-agnostic engine, Vitest. Web layer is Next.js (app router) with the engine and the model key server-side only; the browser holds serializable state and posts each turn.
