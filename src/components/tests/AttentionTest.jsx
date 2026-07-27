import React, { useEffect, useRef, useState } from "react";

const ROUNDS = 30;
const LETTERS = "ABCDEFGHKMNPRT";

function makeSequence() {
  return Array.from({ length: ROUNDS }, () =>
    Math.random() < 0.25 ? "X" : LETTERS[Math.floor(Math.random() * LETTERS.length)]
  );
}

export default function AttentionTest({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(-1);
  const seq = useRef(makeSequence());
  const responded = useRef(false);
  const stats = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });

  const advance = (i) => {
    if (i >= 0) {
      const wasGo = seq.current[i] !== "X";
      if (wasGo && responded.current) stats.current.hits++;
      else if (wasGo) stats.current.misses++;
      else if (responded.current) stats.current.falseAlarms++;
      else stats.current.correctRejections++;
    }
    if (i + 1 >= ROUNDS) {
      const s = stats.current;
      const score = Math.max(20, Math.min(97, Math.round(((s.hits + s.correctRejections) / ROUNDS) * 100) - 3));
      setPhase("done");
      onComplete({ raw: { ...s, rounds: ROUNDS }, score });
      return;
    }
    responded.current = false;
    setIdx(i + 1);
  };

  useEffect(() => {
    if (phase !== "running") return;
    const t = setTimeout(() => advance(idx), 950);
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
        <h2 className="font-display text-2xl text-foreground">Sustained attention</h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Letters will flash one at a time. Tap or press space for every letter —{" "}
          <span className="text-foreground">except X</span>. Withhold your response when you see X. About 30 seconds.
        </p>
        <button onClick={() => { setIdx(-1); setPhase("running"); advance(-1); }}
          className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }

  if (phase === "done") return null;

  return (
    <button onPointerDown={respond} className="w-full h-full flex flex-col items-center justify-center" aria-label="Respond">
      <p className={`font-display text-7xl ${seq.current[idx] === "X" ? "text-[#F2C04E]" : "text-foreground"}`}>
        {seq.current[idx]}
      </p>
      <p className="mt-10 text-xs text-muted-foreground tabular-nums">{idx + 1} / {ROUNDS}</p>
    </button>
  );
}