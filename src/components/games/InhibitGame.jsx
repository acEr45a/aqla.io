import React, { useEffect, useRef, useState } from "react";
import { playFeedback, playTone, unlockAudio } from "@/lib/gameAudio";

// Inhibit — Go / No-Go with a stop signal. Tap for green circles, withhold for red squares.
const ROUNDS = 18;
const STEP_MS = 30;
const WINDOW_MS = 950;

export default function InhibitGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [stim, setStim] = useState(null); // { go: boolean }
  const [progress, setProgress] = useState(0);
  const stats = useRef({ goHit: 0, goMiss: 0, stopCorrect: 0, stopFA: 0 });
  const tapped = useRef(false);
  const raf = useRef(null);
  const timer = useRef(null);

  const runTrial = (i) => {
    if (i >= ROUNDS) {
      const s = stats.current;
      const correct = s.goHit + s.stopCorrect;
      const score = Math.max(10, Math.min(100, Math.round((correct / ROUNDS) * 100 - s.stopFA * 6)));
      setPhase("done");
      onComplete({ raw: { ...s, rounds: ROUNDS }, score });
      return;
    }
    tapped.current = false;
    setRound(i);
    const go = Math.random() > 0.28; // ~72% go trials
    setStim({ go });
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      setProgress(Math.min(1, elapsed / WINDOW_MS));
      if (elapsed >= WINDOW_MS) {
        if (go && !tapped.current) stats.current.goMiss++;
        if (!go && !tapped.current) stats.current.stopCorrect++;
        raf.current = null;
        timer.current = setTimeout(() => runTrial(i + 1), 280);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const start = () => {
    unlockAudio();
    stats.current = { goHit: 0, goMiss: 0, stopCorrect: 0, stopFA: 0 };
    setPhase("running");
    runTrial(0);
  };

  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(timer.current); }, []);

  const respond = () => {
    if (phase !== "running" || !stim) return;
    if (tapped.current) return;
    tapped.current = true;
    if (stim.go) { stats.current.goHit++; playTone(720, 0.09); }
    else { stats.current.stopFA++; playFeedback(false); }
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Inhibit</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          A shape appears each round. Tap for every <span className="text-primary">green circle</span>. Hold back when you see a{" "}
          <span className="text-destructive">red square</span> — that's the stop signal.
        </p>
        <button onClick={start} className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <button onPointerDown={respond} className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-24 h-24 rounded-full border-2 border-border flex items-center justify-center">
        {stim?.go
          ? <span className="w-14 h-14 rounded-full bg-primary" />
          : <span className="w-14 h-14 rounded-md bg-destructive" />}
      </div>
      <div className="mt-6 w-56 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary/70" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-5 text-xs text-muted-foreground tabular-nums">Trial {Math.min(round + 1, ROUNDS)} / {ROUNDS}</p>
    </button>
  );
}