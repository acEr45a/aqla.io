import React, { useEffect, useRef, useState } from "react";

const ROUNDS = 24;
const N = 1;
const LETTERS = "BCDFGHKLMPRT";

function makeSequence() {
  const seq = [];
  for (let i = 0; i < ROUNDS; i++) {
    if (i >= N && Math.random() < 0.3) seq.push(seq[i - N]);
    else seq.push(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  }
  return seq;
}

export default function NBackTest({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(-1);
  const seq = useRef(makeSequence());
  const responded = useRef(false);
  const stats = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });

  const advance = (i) => {
    if (i >= N) {
      const isMatch = seq.current[i] === seq.current[i - N];
      if (isMatch && responded.current) stats.current.hits++;
      else if (isMatch) stats.current.misses++;
      else if (responded.current) stats.current.falseAlarms++;
      else stats.current.correctRejections++;
    }
    if (i + 1 >= ROUNDS) {
      const s = stats.current;
      const scored = s.hits + s.misses + s.falseAlarms + s.correctRejections;
      const score = Math.max(15, Math.min(96, Math.round(((s.hits + s.correctRejections) / scored) * 100) - 4));
      setPhase("done");
      onComplete({ raw: { ...s, rounds: ROUNDS, n: N }, score });
      return;
    }
    responded.current = false;
    setIdx(i + 1);
  };

  useEffect(() => {
    if (phase !== "running") return;
    const t = setTimeout(() => advance(idx), 1800);
    return () => clearTimeout(t);
  }, [phase, idx]);

  const respond = () => { if (phase === "running") responded.current = true; };

  useEffect(() => {
    const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); respond(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase === "intro") {
    return (
      <div className="text-center max-w-sm mx-auto">
        <h2 className="font-display text-2xl text-foreground">Working memory</h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Letters appear one at a time. Tap the screen whenever a letter is the{" "}
          <span className="text-foreground">same as the one just before it</span>. Do nothing otherwise.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          {["K", "M", "M", "B"].map((l, i) => (
            <span key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center font-display ${
              i === 2 ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>{l}</span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Tap on the highlighted one — it repeats the letter before it.</p>
        <button onClick={() => { setIdx(-1); setPhase("running"); advance(-1); }}
          className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }

  if (phase === "done") return null;

  return (
    <button onPointerDown={respond} className="w-full h-full flex flex-col items-center justify-center" aria-label="Match">
      <p className="font-display text-7xl text-foreground">{seq.current[idx]}</p>
      <p className="mt-8 text-xs text-muted-foreground">Tap if this is the same as the previous letter</p>
      <p className="mt-4 text-xs text-muted-foreground tabular-nums">{idx + 1} / {ROUNDS}</p>
    </button>
  );
}