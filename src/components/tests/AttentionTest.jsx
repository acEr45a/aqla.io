import React, { useEffect, useRef, useState } from "react";
import { playTone, unlockAudio } from "@/lib/gameAudio";

// Sustained Attention to Response Task (SART; Robertson et al., 1997).
// Digits 1–9 flash one at a time; respond to every digit except the rare target.
const ROUNDS = 36;
const TARGET = 3; // withhold response to this digit (~1 in 9)
const DIGITS = [1, 2, 4, 5, 6, 7, 8, 9]; // non-target digits

function makeSequence() {
  const seq = [];
  let i = 0;
  while (i < ROUNDS) {
    // Insert a target roughly every ~9 trials, jittered.
    const gap = 7 + Math.floor(Math.random() * 4);
    for (let k = 0; k < gap && i < ROUNDS; k++, i++) {
      seq.push({ digit: DIGITS[Math.floor(Math.random() * DIGITS.length)], isTarget: false });
    }
    if (i < ROUNDS) {
      seq.push({ digit: TARGET, isTarget: true });
      i++;
    }
  }
  return seq.slice(0, ROUNDS);
}

export default function AttentionTest({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(-1);
  const seq = useRef(makeSequence());
  const responded = useRef(false);
  const stats = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });

  const advance = (i) => {
    if (i >= 0) {
      const wasGo = !seq.current[i].isTarget;
      if (wasGo && responded.current) stats.current.hits++;
      else if (wasGo) stats.current.misses++;
      else if (responded.current) stats.current.falseAlarms++;
      else stats.current.correctRejections++;
    }
    if (i + 1 >= ROUNDS) {
      const s = stats.current;
      const score = Math.max(15, Math.min(98, Math.round(((s.hits + s.correctRejections) / ROUNDS) * 100 - s.falseAlarms * 4)));
      setPhase("done");
      onComplete({
        raw: {
          task: "Sustained Attention to Response Task (SART; Robertson et al., 1997)",
          hits: s.hits,
          misses: s.misses,
          false_alarms: s.falseAlarms,
          commission_errors: s.falseAlarms,
          omissions: s.misses,
          correct_rejections: s.correctRejections,
          rounds: ROUNDS,
          target: TARGET,
        },
        score,
      });
      return;
    }
    responded.current = false;
    setIdx(i + 1);
  };

  useEffect(() => {
    if (phase !== "running") return;
    const t = setTimeout(() => advance(idx), 1050);
    return () => clearTimeout(t);
  }, [phase, idx]);

  const respond = () => {
    if (phase !== "running") return;
    if (!responded.current) playTone(seq.current[idx].isTarget ? 200 : 760, 0.09, 0.05);
    responded.current = true;
  };

  useEffect(() => {
    const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); respond(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase === "intro") {
    return (
      <div className="text-center max-w-sm mx-auto">
        <h2 className="font-display text-2xl text-foreground">Sustained attention</h2>
        <p className="mt-1 text-xs text-primary tracking-wide">SART · Robertson et al., 1997</p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Digits 1–9 flash one at a time. Tap or press space for every digit —{" "}
          <span className="text-foreground">except {TARGET}</span>. Withhold your response when you see {TARGET}.
          About 40 seconds.
        </p>
        <button onClick={() => { unlockAudio(); setIdx(-1); setPhase("running"); advance(-1); }}
          className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }

  if (phase === "done") return null;

  const current = seq.current[idx];
  return (
    <button onPointerDown={respond} className="w-full h-full flex flex-col items-center justify-center" aria-label="Respond">
      <p className={`font-display text-7xl tabular-nums ${current.isTarget ? "text-[#F2C04E]" : "text-foreground"}`}>
        {current.digit}
      </p>
      <p className="mt-10 text-xs text-muted-foreground tabular-nums">{idx + 1} / {ROUNDS}</p>
    </button>
  );
}