import React, { useEffect, useRef, useState } from "react";
import { playFeedback, playTone, unlockAudio } from "@/lib/gameAudio";

// Logic Gate — rule induction. Infer the hidden rule behind a number sequence,
// then choose the next term. Rules deepen in complexity each round.
const ROUNDS = 8;

function makeRound(i) {
  const rules = [
    () => { const d = 2 + Math.floor(Math.random() * 6); const a = 1 + Math.floor(Math.random() * 5); return { seq: [a, a + d, a + 2 * d, a + 3 * d], next: a + 4 * d, rule: `+${d}` }; },
    () => { const m = 2 + Math.floor(Math.random() * 2); const a = 1 + Math.floor(Math.random() * 3); return { seq: [a, a * m, a * m * m, a * m * m * m], next: a * m * m * m * m, rule: `×${m}` }; },
    () => { const a = 1 + Math.floor(Math.random() * 4); const b = 1 + Math.floor(Math.random() * 4); return { seq: [a, a + b, a + 2 * b, a + 3 * b], next: a + 4 * b, rule: `+${b}` }; },
    () => { const a = 2 + Math.floor(Math.random() * 4); return { seq: [a, a + a, (a + a) + a, (a + a + a) + a], next: a * 5, rule: `+${a} (linear)` }; },
  ];
  const rule = rules[Math.min(i, rules.length - 1)]();
  const opts = new Set([rule.next]);
  while (opts.size < 4) opts.add(rule.next + (Math.floor(Math.random() * 9) - 4) + (Math.random() > 0.5 ? 0 : 1));
  const options = [...opts].sort(() => Math.random() - 0.5);
  return { ...rule, options };
}

export default function LogicGateGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [data, setData] = useState(null);
  const [correct, setCorrect] = useState(0);
  const start = useRef(0);

  const begin = (i) => {
    if (i >= ROUNDS) {
      const score = Math.round((correct / ROUNDS) * 100);
      setPhase("done");
      onComplete({ raw: { correct, rounds: ROUNDS }, score });
      return;
    }
    setRound(i);
    setData(makeRound(i));
    start.current = Date.now();
  };

  const startGame = () => {
    unlockAudio();
    setCorrect(0);
    setPhase("running");
    begin(0);
  };

  const answer = (opt) => {
    if (phase !== "running") return;
    const ok = opt === data.next;
    if (ok) { setCorrect((c) => c + 1); playFeedback(true); } else playFeedback(false);
    setTimeout(() => begin(round + 1), 350);
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Logic Gate</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Four numbers, one hidden rule. Work out the pattern, then pick the term that comes next. The rules grow more devious each round.
        </p>
        <button onClick={startGame} className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done" || !data) return null;

  return (
    <div className="w-full text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Sequence {round + 1} / {ROUNDS}</p>
      <div className="mt-6 flex items-center justify-center gap-2">
        {data.seq.map((n, i) => (
          <span key={i} className="w-14 h-14 rounded-xl border border-border bg-secondary/40 flex items-center justify-center font-display text-2xl text-foreground tabular-nums">{n}</span>
        ))}
        <span className="w-14 h-14 rounded-xl border-2 border-dashed border-primary/50 flex items-center justify-center font-display text-2xl text-primary">?</span>
      </div>
      <p className="mt-7 text-sm text-muted-foreground">What comes next?</p>
      <div className="mt-4 grid grid-cols-2 gap-3 max-w-xs mx-auto">
        {data.options.map((o, i) => (
          <button key={i} onClick={() => answer(o)} className="h-14 rounded-xl border border-border bg-secondary/30 font-display text-xl text-foreground hover:border-primary/50 transition-colors">{o}</button>
        ))}
      </div>
    </div>
  );
}