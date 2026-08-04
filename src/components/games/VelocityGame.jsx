import React, { useEffect, useRef, useState } from "react";
import { playTone, playFeedback, unlockAudio } from "@/lib/gameAudio";
import DifficultyMeter from "@/components/tests/DifficultyMeter";

// Velocity — adaptive rapid classification (specialty, speed). Sort each symbol by
// colour as fast as you can. Three colours, streak multipliers, animated stream,
// combo meter, and a tempo that accelerates with correct streaks and brakes on errors.
const DURATION = 50;
const COLORS = [
  { key: "L", tone: "#7B94FF", name: "Blue", dir: "←" },
  { key: "U", tone: "#C9F24E", name: "Lime", dir: "↑" },
  { key: "R", tone: "#F26B5E", name: "Coral", dir: "→" },
];
const SHAPES = ["◆", "●", "▲", "✦"];

function makeStim() {
  return {
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  };
}

export default function VelocityGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [stim, setStim] = useState(null);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(DURATION);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [burst, setBurst] = useState(null);
  const [shake, setShake] = useState(false);
  const intervalRef = useRef(950);
  const timer = useRef(null);
  const countdown = useRef(null);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);

  const next = () => {
    setStim(makeStim());
    clearTimeout(timer.current);
    timer.current = setTimeout(next, intervalRef.current);
  };

  const classify = (key) => {
    if (phase !== "running" || !stim) return;
    const ok = stim.color.key === key;
    if (ok) {
      streakRef.current++;
      const mult = 1 + Math.floor(streakRef.current / 4);
      scoreRef.current += mult;
      correctRef.current++;
      setScore(scoreRef.current);
      setStreak(streakRef.current);
      setCombo(mult);
      setBurst({ color: stim.color.tone, id: Date.now() });
      setTimeout(() => setBurst(null), 350);
      playTone(660 + streakRef.current * 12, 0.06);
      if (streakRef.current % 3 === 0) {
        intervalRef.current = Math.max(360, intervalRef.current - 65);
        setLevel((l) => Math.min(7, l + 1));
      }
    } else {
      streakRef.current = 0; setStreak(0); setCombo(0);
      intervalRef.current = Math.min(1000, intervalRef.current + 110);
      setLevel((l) => Math.max(1, l - 1));
      setShake(true);
      setTimeout(() => setShake(false), 250);
      playFeedback(false);
    }
    next();
  };

  const start = () => {
    unlockAudio();
    scoreRef.current = 0; streakRef.current = 0; correctRef.current = 0; intervalRef.current = 950;
    setScore(0); setStreak(0); setLevel(1); setCombo(0); setSeconds(DURATION);
    setPhase("running");
    next();
    countdown.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
  };

  useEffect(() => {
    if (phase === "running" && seconds === 0) {
      clearInterval(countdown.current); clearTimeout(timer.current);
      setPhase("done");
      const acc = correctRef.current / Math.max(1, correctRef.current + Math.floor((DURATION * 1000 - intervalRef.current) / intervalRef.current));
      onComplete({ raw: { sorted: scoreRef.current, correct: correctRef.current, time_s: DURATION, peak_level: level }, score: Math.min(100, scoreRef.current * 2) });
    }
  }, [phase, seconds, level]);

  useEffect(() => () => { clearTimeout(timer.current); clearInterval(countdown.current); }, []);

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Velocity</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Sort each symbol by colour: <span style={{ color: COLORS[0].tone }}>blue left</span>, <span style={{ color: COLORS[1].tone }}>lime up</span>, <span style={{ color: COLORS[2].tone }}>coral right</span>. Build streaks for score multipliers and a faster stream — slip and the tempo brakes. {DURATION} seconds.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Adaptive processing speed</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <div className={`w-full text-center ${shake ? "animate-pulse" : ""}`}>
      <div className="flex items-center justify-between max-w-xs mx-auto">
        <p className="font-display text-3xl text-primary tabular-nums">{seconds}s</p>
        <div className="scale-90"><DifficultyMeter level={level} total={7} label="Tempo" /></div>
      </div>
      <div className="mt-1 flex items-center justify-center gap-3 text-xs text-muted-foreground tabular-nums">
        <span>score {score}</span>
        <span className="text-primary">×{combo || 1} combo</span>
        <span>streak {streak}</span>
      </div>
      <div className="mt-8 h-32 flex items-center justify-center relative">
        {stim && (
          <span key={stim.shape + stim.color.key} className="font-display text-7xl animate-[zoom-in_0.15s_ease-out]"
            style={{ color: stim.color.tone, textShadow: `0 0 28px ${stim.color.tone}66` }}>
            {stim.shape}
          </span>
        )}
        {burst && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-3xl font-display animate-[ping_0.35s_ease-out]" style={{ color: burst.color }}>✦</span>
          </span>
        )}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        {COLORS.map((c) => (
          <button key={c.key} onClick={() => classify(c.key)}
            className="px-6 py-4 rounded-2xl border-2 text-sm font-medium transition-transform active:scale-95"
            style={{ borderColor: c.tone, color: c.tone, boxShadow: `0 0 16px ${c.tone}22` }}>
            <span className="block text-lg">{c.dir}</span>
            <span className="block text-[10px] mt-0.5">{c.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 w-48 mx-auto h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.min(100, (streak / 12) * 100)}%` }} />
      </div>
    </div>
  );
}