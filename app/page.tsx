"use client";

import { useState } from "react";
import type { GameState } from "@/src/types";
import type { ClientBeat, ClientChoice, TurnResponse } from "@/lib/types";

type Phase = "boot" | "home" | "wander" | "event" | "end";

const clock = (mins: number): string => {
  const t = 17 * 60 + mins;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

async function turn(body: Record<string, unknown>): Promise<TurnResponse> {
  const res = await fetch("/api/turn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function Page() {
  const [state, setState] = useState<GameState | null>(null);
  const [beat, setBeat] = useState<ClientBeat | null>(null);
  const [phase, setPhase] = useState<Phase>("boot");
  const [voice, setVoice] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [giftId, setGiftId] = useState<string | null>(null);
  const [giftAmt, setGiftAmt] = useState("");
  const [heading, setHeading] = useState(false);
  const [quiet, setQuiet] = useState(false);

  const run = async (body: Record<string, unknown>): Promise<TurnResponse> => {
    setBusy(true);
    try {
      return await turn(body);
    } finally {
      setBusy(false);
    }
  };

  const resetGift = () => {
    setGiftId(null);
    setGiftAmt("");
  };

  const begin = async () => {
    const r = await run({ action: "start" });
    setState(r.state);
    setBeat(r.beat);
    setVoice(null);
    setVerdict(null);
    setHeading(false);
    setQuiet(false);
    setPhase("home");
  };

  const applyEnd = (r: TurnResponse): boolean => {
    if (r.ended) {
      setState(r.state);
      setVerdict(r.verdict ?? "The night is over.");
      setPhase("end");
      return true;
    }
    return false;
  };

  const choose = async (kind: "chooseHome" | "chooseEvent", choice: ClientChoice) => {
    if (!beat || !state) return;
    if (choice.gift && giftId !== choice.id) {
      setGiftId(choice.id);
      return;
    }
    const gift = choice.gift ? Math.max(0, Math.floor(Number(giftAmt) || 0)) : undefined;
    const r = await run({
      action: kind,
      state,
      sceneId: beat.sceneId,
      choiceId: choice.id,
      gift,
      heading,
    });
    resetGift();
    setVoice(r.narration);
    if (applyEnd(r)) return;
    setState(r.state);
    if (kind === "chooseHome") setBeat(r.beat);
    else setPhase("wander");
  };

  const stepOut = () => {
    setPhase("wander");
    setQuiet(false);
  };

  const goWander = async (tags: string[], isHome: boolean) => {
    if (!state) return;
    setHeading(isHome);
    setQuiet(false);
    const r = await run({ action: "wander", state, tags, heading: isHome });
    setState(r.state);
    if (applyEnd(r)) return;
    if (r.beat) {
      setBeat(r.beat);
      setVoice(null);
      setPhase("event");
    } else {
      setQuiet(true); // nothing drew; stay in wander
    }
  };

  const meters = state && (
    <div className="meters">
      <span className="meter">&#8358;<b>{state.cash}</b></span>
      <span className={"meter" + (state.fuel <= 0 ? " warn" : "")}>fuel <b>{state.fuel}</b></span>
      <span className="meter">{state.power.replace("_", " ")}</span>
      <span className={"meter" + (state.meters.hunger >= 70 ? " warn" : "")}>hunger <b>{Math.round(state.meters.hunger)}</b></span>
      <span className={"meter" + (state.meters.babe <= 25 ? " warn" : "")}>babe <b>{Math.round(state.meters.babe)}</b></span>
      <span className="meter">flex <b>{Math.round(state.meters.flex)}</b></span>
      <span className="meter">luck <b>{Math.round(state.meters.luck)}</b></span>
      <span className="meter">{clock(state.clock)}</span>
    </div>
  );

  const renderChoice = (choice: ClientChoice, kind: "chooseHome" | "chooseEvent") => (
    <div key={choice.id}>
      <button className="btn" disabled={busy} onClick={() => choose(kind, choice)}>
        <div className="c-t">{choice.label}</div>
        {choice.desc && <div className="c-d">{choice.desc}</div>}
      </button>
      {choice.gift && giftId === choice.id && (
        <div className="giftrow">
          <input
            type="number"
            min={0}
            placeholder="how much? (naira)"
            value={giftAmt}
            autoFocus
            onChange={(e) => setGiftAmt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && choose(kind, choice)}
          />
          <button className="give" disabled={busy} onClick={() => choose(kind, choice)}>Give</button>
        </div>
      )}
    </div>
  );

  return (
    <main className="stage">
      <div className="top">
        <span className="wordmark">NEPA <span className="dim">NIGHT</span></span>
        {state && <span className="daylabel">Day {state.day} &middot; {clock(state.clock)}</span>}
      </div>

      {phase === "boot" && (
        <section className="title-hero">
          <h1>NEPA <span className="dim">Night</span></h1>
          <p>One evening in Lagos. Five thousand naira, two bars of fuel, and the light don go. Survive the night. Every choice go cost you something.</p>
          <button className="begin" disabled={busy} onClick={begin}>{busy ? "..." : "Begin the night"}</button>
        </section>
      )}

      {phase !== "boot" && state && (
        <>
          {meters}

          {voice && <p className="voice">&ldquo;{voice}&rdquo;</p>}

          {phase === "home" && beat && (
            <>
              {!voice && <p className="scene">{beat.prompt}</p>}
              <div className="choices">
                {beat.choices.map((c) => renderChoice(c, "chooseHome"))}
                <button className="btn step" disabled={busy} onClick={stepOut}>
                  <div className="c-t">Step out into the night</div>
                </button>
              </div>
            </>
          )}

          {phase === "wander" && (
            <div className="wander">
              {quiet && <p className="muted">Quiet. Nothing jumps at you this time.</p>}
              <button className="btn" disabled={busy} onClick={() => goWander(["rave"], false)}>
                <div className="c-t">Hit the rave</div>
              </button>
              <button className="btn" disabled={busy} onClick={() => goWander(["street"], false)}>
                <div className="c-t">Waka the street</div>
              </button>
              <button className="btn" disabled={busy} onClick={() => goWander(["road", "night"], true)}>
                <div className="c-t">Head home</div>
                <div className="c-d">The road. Then the night ends.</div>
              </button>
            </div>
          )}

          {phase === "event" && beat && (
            <>
              <p className="scene">{beat.prompt}</p>
              <div className="choices">
                {beat.choices.length === 0 && <p className="muted">You can&rsquo;t afford to do anything here.</p>}
                {beat.choices.map((c) => renderChoice(c, "chooseEvent"))}
              </div>
            </>
          )}

          {phase === "end" && (
            <section className="card endcard">
              <h2>Day 1, done</h2>
              <p className="v">{verdict}</p>
              {meters}
              <button className="begin" disabled={busy} onClick={begin} style={{ marginTop: 22 }}>
                Run another night
              </button>
            </section>
          )}

          {busy && <p className="busy" style={{ marginTop: 16 }}>...</p>}
        </>
      )}

      <p className="footnote">engine decides, the voice only narrates</p>
    </main>
  );
}
