import React, { useEffect, useRef, useState } from "react";
import { playFeedback, playTone, unlockAudio } from "@/lib/gameAudio";

// Brief Psychomotor Vigilance Task (PVT-B) adaptation (Dinges & Powell, 1985).
// Gold-standard measure of vigilant attention; sensitive to sleep loss.
const TRIALS = 8;
const LAPSE_MS = 500; // RT ≥ 500 ms counts as a lapse (attentional failure)

export default function ReactionTest({ onComplete }) {
  const [phase, setPhase] = useState("intro"); // intro | waiting | go | tooSoon | between | done
  const [trial, setTrial] = useState(0);
  const [times, setTimes] = useState([]);
  const goAt = useRef(0);
  const timer = useRef(null);

  const startTrial = () => {
    unlockAudio();
    setPhase("waiting");
    // PVT uses a pseudo-random 2–10 s foreperiod; shortened here for a brief screen.
    timer.current = setTimeout(() => {
      goAt.current = performance.now();
      playTone(740, 0.13, 0.06);
      setPhase("go");
    }, 1500 + Math.random() * 3500);
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
      const mean = next.reduce((a, b) => a + b, 0) / next.length;
      const lapses = next.filter((t) => t >= LAPSE_MS).length;
      const fastest = [...next].sort((a, b) => a - b).slice(0, Math.max(1, Math.ceil(next.length / 10)));
      const fastest10 = Math.round(fastest.reduce((a, b) => a + b, 0) / fastest.length);
      // Well-rested adults average ~250 ms; lapses and slower mean reduce the score.
      const score = Math.max(15, Math.min(98, Math.round(100 - (mean - 240) / 3 - lapses * 8)));
      setPhase("done");
      onComplete({
        raw: {
          task: "Brief Psychomotor Vigilance Task (PVT-B) adaptation",
          trials: next,
          mean_rt_ms: Math.round(mean),
          lapses,
          lapse_threshold_ms: LAPSE_MS,
          fastest_10pct_ms: fastest10,
        },
        score,
      });
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
        <p className="mt-1 text-xs text-primary tracking-wide">Psychomotor Vigilance Task · adapted</p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Wait for the counter to appear, then tap or press space as fast as you can. {TRIALS} trials.
          Responses slower than {LAPSE_MS} ms count as attentional lapses. Don't react early.
        </p>
        <button onClick={startTrial}
          className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
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