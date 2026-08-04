import React, { useEffect, useRef, useState } from "react";
import { playFeedback, playTone, unlockAudio } from "@/lib/gameAudio";

// Conflict — Stroop with a cued dimension (specialty, control). A colour word is
// printed in ink of another colour. Each trial cues which dimension to report —
// the WORD or the INK — forcing constant re-configuration.
const COLORS = [
  { name: "Red", tone: "#F26B5E" },
  { name: "Green", tone: "#7BD389" },
  { name: "Blue", tone: "#7B94FF" },
  { name: "Gold", tone: "#E8B84A" },
];
const TRIALS = 20;
const WINDOW_MS = 2600;

function makeTrials() {
  return Array.from({ length: TRIALS }, () => {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    let ink = COLORS[Math.floor(Math.random() * COLORS.length)];
    while (ink.name === word.name) ink = COLORS[Math.floor(Math.random() * COLORS.length)];
    const cue = Math.random() > 0.5 ? "WORD" : "INK";
    return { word, ink, cue };
  });
}

export default function ConflictGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [i, setI] = useState(0);
  const [trial, setTrial] = useState(null);
  const [progress, setProgress] = useState(0);
  const trials = useRef(makeTrials());
  const correct = useRef(0);
  const answered = useRef(false);
  const raf = useRef(null);
  const startRef = useRef(0);

  const showTrial = (idx) => {
    if (idx >= TRIALS) {
      const score = Math.round((correct.current / TRIALS) * 100);
      setPhase("done");
      onComplete({ raw: { correct: correct.current, trials: TRIALS }, score });
      return;
    }
    setI(idx);
    setTrial(trials.current[idx]);
    answered.current = false;
    setProgress(0);
    startRef.current = performance.now();
    const tick = () => {
      const e = performance.now() - startRef.current;
      setProgress(Math.min(1, e / WINDOW_MS));
      if (e >= WINDOW_MS) { raf.current = null; showTrial(idx + 1); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const start = () => {
    unlockAudio();
    correct.current = 0;
    trials.current = makeTrials();
    setPhase("running");
    showTrial(0);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const answer = (color) => {
    if (phase !== "running" || answered.current || !trial) return;
    answered.current = true;
    const target = trial.cue === "WORD" ? trial.word : trial.ink;
    if (color.name === target.name) { correct.current++; playFeedback(true); }
    else playFeedback(false);
    cancelAnimationFrame(raf.current);
    setTimeout(() => showTrial(i + 1), 280);
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Conflict</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          A colour word is printed in a conflicting ink. Each round the cue above tells you which to report — the <span className="text-foreground">word</span> or the <span className="text-foreground">ink</span>. Ignore everything else.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Stroop interference</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done" || !trial) return null;

  return (
    <div className="w-full text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Trial {i + 1} / {TRIALS}</p>
      <p className="mt-2 px-5 py-1.5 rounded-full text-xs font-medium text-primary bg-primary/10 inline-block">
        Report the {trial.cue === "WORD" ? "WORD" : "INK COLOUR"}
      </p>
      <p className="mt-7 font-display text-5xl font-medium" style={{ color: trial.ink.tone }}>{trial.word.name}</p>
      <div className="mt-4 w-56 mx-auto h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary/60" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 max-w-xs mx-auto">
        {COLORS.map((c) => (
          <button key={c.name} onClick={() => answer(c)} className="h-14 rounded-xl border-2 text-sm font-medium" style={{ borderColor: c.tone, color: c.tone }}>{c.name}</button>
        ))}
      </div>
    </div>
  );
}