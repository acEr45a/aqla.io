import React, { useEffect, useRef, useState } from "react";
import { playFeedback, playTone, unlockAudio } from "@/lib/gameAudio";

const TRIALS = 5;

export default function ReactionTest({ onComplete }) {
  const [phase, setPhase] = useState("intro"); // intro | waiting | go | tooSoon | between | done
  const [trial, setTrial] = useState(0);
  const [times, setTimes] = useState([]);
  const goAt = useRef(0);
  const timer = useRef(null);

  const startTrial = () => {
    unlockAudio();
    setPhase("waiting");
    timer.current = setTimeout(() => {
      goAt.current = performance.now();
      playTone(740, 0.13, 0.06);
      setPhase("go");
    }, 1200 + Math.random() * 2500);
  };

  const react = () => {
    if (phase === "waiting") {
      clearTimeout(timer.current);
      playFeedback(false);
      setPhase("tooSoon");
      return;
    }
    if (phase !== "go") return;
    const ms = Math.round(performance.now() - goAt.current);
    playFeedback(true);
    const next = [...times, ms];
    setTimes(next);
    if (next.length >= TRIALS) {
      const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
      const score = Math.max(20, Math.min(97, Math.round(100 - (avg - 200) / 5)));
      setPhase("done");
      onComplete({ raw: { trials: next, average_ms: avg }, score });
    } else {
      setTrial(next.length);
      setPhase("between");
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (phase === "intro" || phase === "between" || phase === "tooSoon") startTrial();
      else react();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  if (phase === "intro") {
    return (
      <div className="text-center max-w-sm mx-auto">
        <h2 className="font-display text-2xl text-foreground">Reaction time</h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Wait for the screen to turn <span className="text-primary">green</span>, then tap anywhere or press space as fast
          as you can. {TRIALS} trials. Don't react early.
        </p>
        <button onClick={startTrial} className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }

  if (phase === "tooSoon" || phase === "between") {
    return (
      <button onClick={startTrial} className="text-center w-full h-full flex flex-col items-center justify-center">
        <p className="font-display text-xl text-foreground">{phase === "tooSoon" ? "Too soon." : "Recorded."}</p>
        <p className="mt-2 text-sm text-muted-foreground">Trial {trial + 1} of {TRIALS} — tap or press space to continue</p>
      </button>
    );
  }

  if (phase === "done") return null;

  return (
    <button onPointerDown={react} aria-label="Reaction area"
      className={`w-full h-full flex items-center justify-center transition-colors duration-100 ${phase === "go" ? "bg-primary/20" : ""}`}>
      <p className={`font-display text-3xl ${phase === "go" ? "text-primary" : "text-muted-foreground"}`}>
        {phase === "go" ? "NOW" : "Wait…"}
      </p>
    </button>
  );
}