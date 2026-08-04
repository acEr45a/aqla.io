import React, { useEffect, useRef, useState } from "react";
import { playTone, unlockAudio } from "@/lib/gameAudio";

// Tempo Lock — timing precision. Listen to a metronome, then reproduce the
// same interval by tapping. Three rounds at different tempos.
const ROUNDS = [
  { interval: 620, label: "Steady" },
  { interval: 460, label: "Brisk" },
  { interval: 360, label: "Fast" },
];
const BEATS = 4;

export default function TempoLockGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [mode, setMode] = useState("idle"); // idle | listening | tapping | feedback
  const [taps, setTaps] = useState([]);
  const [pulse, setPulse] = useState(false);
  const timers = useRef([]);
  const startRef = useRef(0);
  const deviations = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const playMetronome = (interval, cb) => {
    setMode("listening");
    for (let i = 0; i < BEATS; i++) {
      timers.current.push(setTimeout(() => { playTone(560, 0.08, 0.05); setPulse(true); setTimeout(() => setPulse(false), 90); }, i * interval));
    }
    timers.current.push(setTimeout(cb, BEATS * interval + 200));
  };

  const beginRound = (i) => {
    if (i >= ROUNDS.length) {
      const avg = deviations.current.reduce((a, b) => a + b, 0) / deviations.current.length;
      const score = Math.max(10, Math.min(100, Math.round(100 - avg / 4)));
      setPhase("done");
      onComplete({ raw: { avg_deviation_ms: Math.round(avg), rounds: ROUNDS.length }, score });
      return;
    }
    setRound(i);
    setTaps([]);
    playMetronome(ROUNDS[i].interval, () => { setMode("tapping"); startRef.current = performance.now(); });
  };

  const start = () => {
    unlockAudio();
    deviations.current = [];
    setPhase("running");
    beginRound(0);
  };

  useEffect(() => () => clearTimers(), []);

  const tap = () => {
    if (mode !== "tapping") return;
    const t = performance.now();
    const expected = startRef.current + taps.length * ROUNDS[round].interval;
    const dev = Math.abs(t - expected);
    deviations.current.push(dev);
    playTone(740, 0.07, 0.05);
    const next = [...taps, dev];
    setTaps(next);
    if (next.length >= BEATS) {
      setMode("feedback");
      timers.current.push(setTimeout(() => beginRound(round + 1), 900));
    }
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Tempo Lock</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Four beats play at a set tempo. Then tap the screen four times to reproduce the exact same interval. Land on the beat — the closer, the higher the score.
        </p>
        <button onClick={start} className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <button onPointerDown={tap} className="w-full h-full flex flex-col items-center justify-center">
      <p className="text-xs text-muted-foreground tabular-nums">Round {round + 1} / {ROUNDS.length} · {ROUNDS[round].label}</p>
      <span className={`mt-8 w-32 h-32 rounded-full border-2 flex items-center justify-center transition-all ${pulse ? "border-primary bg-primary/20 scale-110" : "border-border bg-secondary/30"}`}>
        <span className={`w-10 h-10 rounded-full ${pulse || mode === "tapping" ? "bg-primary" : "bg-muted-foreground/40"}`} />
      </span>
      <p className="mt-7 text-sm text-muted-foreground">
        {mode === "listening" ? "Listen to the beat…" : mode === "tapping" ? `Tap the rhythm · ${taps.length} / ${BEATS}` : "Locked — next tempo…"}
      </p>
    </button>
  );
}