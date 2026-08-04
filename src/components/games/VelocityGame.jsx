import React, { useEffect, useRef, useState } from "react";
import { playTone, playFeedback, unlockAudio } from "@/lib/gameAudio";
import DifficultyMeter from "@/components/tests/DifficultyMeter";

// Velocity — adaptive rapid classification (specialty, speed). Sort symbols by colour
// as fast as you can. Correct streaks accelerate the stream; errors slow it back down.
const DURATION = 45;
const COLORS = [
  { key: "L", tone: "#7B94FF", name: "Blue" },
  { key: "R", tone: "#C9F24E", name: "Lime" },
];
const SHAPES = ["◆", "●", "▲"];

function makeStim() {
  const c = COLORS[Math.floor(Math.random() * COLORS.length)];
  const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { color: c, shape: s };
}

export default function VelocityGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [stim, setStim] = useState(null);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(DURATION);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const intervalRef = useRef(900);
  const timer = useRef(null);
  const countdown = useRef(null);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);

  const next = () => {
    setStim(makeStim());
    clearTimeout(timer.current);
    timer.current = setTimeout(next, intervalRef.current);
  };

  const classify = (key) => {
    if (phase !== "running" || !stim) return;
    const ok = stim.color.key === key;
    if (ok) {
      scoreRef.current++; setScore(scoreRef.current);
      streakRef.current++; setStreak(streakRef.current);
      playTone(720, 0.06);
      if (streakRef.current % 3 === 0) {
        intervalRef.current = Math.max(380, intervalRef.current - 70);
        setLevel((l) => Math.min(6, l + 1));
      }
    } else {
      streakRef.current = 0; setStreak(0);
      intervalRef.current = Math.min(950, intervalRef.current + 90);
      setLevel((l) => Math.max(1, l - 1));
      playFeedback(false);
    }
    next();
  };

  const start = () => {
    unlockAudio();
    scoreRef.current = 0; streakRef.current = 0; intervalRef.current = 900;
    setScore(0); setStreak(0); setLevel(1); setSeconds(DURATION);
    setPhase("running");
    next();
    countdown.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
  };

  useEffect(() => {
    if (phase === "running" && seconds === 0) {
      clearInterval(countdown.current); clearTimeout(timer.current);
      setPhase("done");
      onComplete({ raw: { sorted: scoreRef.current, time_s: DURATION, peak_level: level }, score: Math.min(100, scoreRef.current * 3) });
    }
  }, [phase, seconds]);

  useEffect(() => () => { clearTimeout(timer.current); clearInterval(countdown.current); }, []);

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Velocity</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Sort each symbol by colour — blue to the left, lime to the right. Build streaks to speed up the stream; slip and it slows. {DURATION} seconds, score everything you can.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Adaptive processing speed</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <div className="w-full text-center">
      <div className="flex items-center justify-between max-w-xs mx-auto">
        <p className="font-display text-3xl text-primary tabular-nums">{seconds}s</p>
        <div className="scale-90"><DifficultyMeter level={level} total={6} label="Tempo" /></div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">Sorted {score} · streak {streak}</p>
      <div className="mt-10 h-28 flex items-center justify-center">
        {stim && <span className="font-display text-6xl" style={{ color: stim.color.tone }}>{stim.shape}</span>}
      </div>
      <div className="mt-8 flex justify-center gap-4">
        <button onClick={() => classify("L")} className="px-10 py-4 rounded-2xl border-2 text-sm font-medium" style={{ borderColor: COLORS[0].tone, color: COLORS[0].tone }}>← {COLORS[0].name}</button>
        <button onClick={() => classify("R")} className="px-10 py-4 rounded-2xl border-2 text-sm font-medium" style={{ borderColor: COLORS[1].tone, color: COLORS[1].tone }}>{COLORS[1].name} →</button>
      </div>
    </div>
  );
}