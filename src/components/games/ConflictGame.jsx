import React, { useEffect, useRef, useState } from "react";
import { playFeedback, playTone, unlockAudio } from "@/lib/gameAudio";

// Conflict — Stroop with a cued dimension (specialty, control). A colour word is
// printed in conflicting ink. Each trial cues which dimension to report — WORD or
// INK — forcing constant re-configuration. 28 trials, RT tracking, adaptive window,
// streak meter, and accuracy + speed scoring.
const COLORS = [
  { name: "Red", tone: "#F26B5E" },
  { name: "Green", tone: "#7BD389" },
  { name: "Blue", tone: "#7B94FF" },
  { name: "Gold", tone: "#E8B84A" },
  { name: "Violet", tone: "#B584FF" },
];
const TRIALS = 28;
const BASE_WINDOW = 2800;
const MIN_WINDOW = 1500;

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
  const [streak, setStreak] = useState(0);
  const [flash, setFlash] = useState(null);
  const trials = useRef(makeTrials());
  const correct = useRef(0);
  const rts = useRef([]);
  const answered = useRef(false);
  const raf = useRef(null);
  const startRef = useRef(0);
  const windowRef = useRef(BASE_WINDOW);
  const streakRef = useRef(0);

  const showTrial = (idx) => {
    if (idx >= TRIALS) {
      const acc = correct.current / TRIALS;
      const avgRt = rts.current.length ? rts.current.reduce((s, r) => s + r, 0) / rts.current.length : BASE_WINDOW;
      // score: accuracy * speed factor (faster than window = bonus)
      const speedFactor = Math.max(0.4, Math.min(1.2, BASE_WINDOW / Math.max(600, avgRt)));
      const score = Math.round(acc * speedFactor * 100);
      setPhase("done");
      onComplete({ raw: { correct: correct.current, trials: TRIALS, accuracy: +acc.toFixed(2), avg_rt_ms: Math.round(avgRt) }, score });
      return;
    }
    setI(idx);
    setTrial(trials.current[idx]);
    answered.current = false;
    setProgress(0);
    setFlash(null);
    startRef.current = performance.now();
    const tick = () => {
      const e = performance.now() - startRef.current;
      setProgress(Math.min(1, e / windowRef.current));
      if (e >= windowRef.current) {
        // timed out → wrong
        if (!answered.current) {
          streakRef.current = 0; setStreak(0); setFlash({ ok: false, timeout: true });
          playFeedback(false);
        }
        raf.current = null; showTrial(idx + 1); return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const start = () => {
    unlockAudio();
    correct.current = 0; rts.current = []; streakRef.current = 0; windowRef.current = BASE_WINDOW;
    trials.current = makeTrials();
    setStreak(0);
    setPhase("running");
    showTrial(0);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const answer = (color) => {
    if (phase !== "running" || answered.current || !trial) return;
    answered.current = true;
    const target = trial.cue === "WORD" ? trial.word : trial.ink;
    const rt = performance.now() - startRef.current;
    const ok = color.name === target.name;
    if (ok) {
      correct.current++; rts.current.push(rt);
      streakRef.current++; setStreak(streakRef.current);
      playTone(660 + streakRef.current * 10, 0.07);
      // accelerate window with streak
      if (streakRef.current % 3 === 0) windowRef.current = Math.max(MIN_WINDOW, windowRef.current - 150);
    } else {
      streakRef.current = 0; setStreak(0);
      windowRef.current = Math.min(BASE_WINDOW, windowRef.current + 120);
      playFeedback(false);
    }
    setFlash({ ok, color: color.tone });
    cancelAnimationFrame(raf.current);
    setTimeout(() => showTrial(i + 1), 300);
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Conflict</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          A colour word is printed in conflicting ink. Each trial the cue above tells you which to report — the <span className="text-foreground">WORD</span> or the <span className="text-foreground">INK</span>. Correct streaks tighten the clock; errors loosen it. {TRIALS} trials, scored on accuracy and speed.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Stroop interference</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done" || !trial) return null;

  return (
    <div className="w-full text-center">
      <div className="flex items-center justify-between max-w-xs mx-auto">
        <p className="text-xs text-muted-foreground tabular-nums">Trial {i + 1} / {TRIALS}</p>
        <p className="text-xs text-primary tabular-nums">streak {streak}</p>
      </div>
      <p className="mt-3 px-5 py-1.5 rounded-full text-xs font-medium text-primary bg-primary/10 inline-block tracking-wider animate-[fadeIn_0.2s]">
        REPORT THE {trial.cue === "WORD" ? "WORD" : "INK COLOUR"}
      </p>
      <div className="mt-7 h-24 flex items-center justify-center relative">
        <span className="font-display text-5xl font-medium transition-transform"
          style={{ color: trial.ink.tone, textShadow: `0 0 28px ${trial.ink.tone}44`, transform: flash ? (flash.ok ? "scale(1.08)" : "scale(0.94)") : "scale(1)" }}>
          {trial.word.name}
        </span>
        {flash && (
          <span className="absolute -bottom-2 text-xs font-medium animate-[fadeIn_0.2s]"
            style={{ color: flash.ok ? "#C9F24E" : "#F26B5E" }}>
            {flash.ok ? "✓ correct" : flash.timeout ? "timed out" : "✗ wrong"}
          </span>
        )}
      </div>
      <div className="mt-6 w-56 mx-auto h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full transition-[width] duration-75" style={{ width: `${progress * 100}%`, background: progress > 0.8 ? "#F26B5E" : "#C9F24E" }} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2.5 max-w-xs mx-auto sm:grid-cols-3">
        {COLORS.map((c) => (
          <button key={c.name} onClick={() => answer(c)}
            className="h-14 rounded-xl border-2 text-sm font-medium transition-transform active:scale-95 hover:scale-105"
            style={{ borderColor: c.tone, color: c.tone, boxShadow: `0 0 12px ${c.tone}22` }}>
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}