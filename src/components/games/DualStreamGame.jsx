import React, { useEffect, useRef, useState } from "react";
import { playTone, unlockAudio } from "@/lib/gameAudio";

// Dual Stream — divided attention. Two stimulus streams advance together;
// tap the matching stream whenever its target appears. Both must be watched at once.
const ROUNDS = 20;
const LETTERS = "ABCDEF";
const LEFT_TARGET = "A";
const RIGHT_TARGET = "3";

export default function DualStreamGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [left, setLeft] = useState("—");
  const [right, setRight] = useState("—");
  const seq = useRef(null);
  const stats = useRef({ lHit: 0, lFA: 0, rHit: 0, rFA: 0 });
  const tapped = useRef({ l: false, r: false });
  const timer = useRef(null);

  const build = () => ({
    l: Array.from({ length: ROUNDS }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]),
    r: Array.from({ length: ROUNDS }, () => String(1 + Math.floor(Math.random() * 9))),
  });

  const showRound = (i) => {
    if (i >= ROUNDS) {
      const s = stats.current;
      const correct = s.lHit + s.rHit;
      const errors = s.lFA + s.rFA;
      const score = Math.max(10, Math.min(100, Math.round(((correct - errors) / (ROUNDS * 2)) * 100)));
      setPhase("done");
      onComplete({ raw: { ...s, rounds: ROUNDS }, score });
      return;
    }
    tapped.current = { l: false, r: false };
    setLeft(seq.current.l[i]);
    setRight(seq.current.r[i]);
    setRound(i);
    timer.current = setTimeout(() => showRound(i + 1), 1150);
  };

  const start = () => {
    unlockAudio();
    seq.current = build();
    stats.current = { lHit: 0, lFA: 0, rHit: 0, rFA: 0 };
    setPhase("running");
    showRound(0);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const tap = (side) => {
    if (phase !== "running") return;
    if (side === "l") {
      if (tapped.current.l) return;
      tapped.current.l = true;
      if (left === LEFT_TARGET) { stats.current.lHit++; playTone(740, 0.1); }
      else { stats.current.lFA++; playTone(150, 0.12); }
    } else {
      if (tapped.current.r) return;
      tapped.current.r = true;
      if (right === RIGHT_TARGET) { stats.current.rHit++; playTone(880, 0.1); }
      else { stats.current.rFA++; playTone(150, 0.12); }
    }
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Dual Stream</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Two streams flash at once. Tap the <span className="text-foreground">left</span> card when it shows{" "}
          <span className="text-chart-2">{LEFT_TARGET}</span>, the <span className="text-foreground">right</span> card when it shows{" "}
          <span className="text-chart-1">{RIGHT_TARGET}</span>. Watch both — targets can land in either.
        </p>
        <button onClick={start} className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <div className="w-full text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Round {Math.min(round + 1, ROUNDS)} / {ROUNDS}</p>
      <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto">
        <button onClick={() => tap("l")} className="h-40 rounded-2xl border border-border bg-secondary/40 flex items-center justify-center active:scale-95 transition-transform">
          <span className="font-display text-5xl text-chart-2">{left}</span>
        </button>
        <button onClick={() => tap("r")} className="h-40 rounded-2xl border border-border bg-secondary/40 flex items-center justify-center active:scale-95 transition-transform">
          <span className="font-display text-5xl tabular-nums text-chart-1">{right}</span>
        </button>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">Tap a card the instant its target appears.</p>
    </div>
  );
}