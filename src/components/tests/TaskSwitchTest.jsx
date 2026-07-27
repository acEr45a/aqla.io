import React, { useRef, useState } from "react";

const ROUNDS = 20;

function makeTrials() {
  return Array.from({ length: ROUNDS }, () => ({
    num: 1 + Math.floor(Math.random() * 9),
    rule: Math.random() < 0.5 ? "parity" : "magnitude",
  }));
}

const LABELS = {
  parity: { prompt: "Odd or even?", a: "Odd", b: "Even", color: "#7B94FF" },
  magnitude: { prompt: "Below or above 5?", a: "Below 5", b: "Above 5", color: "#C9F24E" },
};

export default function TaskSwitchTest({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [i, setI] = useState(0);
  const trials = useRef(makeTrials());
  const start = useRef(0);
  const stats = useRef({ correct: 0, switchCorrect: 0, switchTotal: 0, rts: [] });

  const answer = (choice) => {
    const t = trials.current[i];
    const prev = trials.current[i - 1];
    const isSwitch = prev && prev.rule !== t.rule;
    const truth = t.rule === "parity" ? (t.num % 2 === 1 ? "a" : "b") : t.num < 5 ? "a" : "b";
    const ok = choice === truth;
    if (ok) stats.current.correct++;
    if (isSwitch) { stats.current.switchTotal++; if (ok) stats.current.switchCorrect++; }
    stats.current.rts.push(Date.now() - start.current);

    if (i + 1 >= ROUNDS) {
      const s = stats.current;
      const accuracy = s.correct / ROUNDS;
      const meanRt = s.rts.reduce((a, b) => a + b, 0) / s.rts.length;
      const speed = Math.max(0, Math.min(1, (2200 - meanRt) / 1600));
      const score = Math.max(15, Math.min(96, Math.round(accuracy * 78 + speed * 22)));
      setPhase("done");
      onComplete({ raw: { ...s, mean_rt_ms: Math.round(meanRt), rounds: ROUNDS }, score });
      return;
    }
    start.current = Date.now();
    setI(i + 1);
  };

  if (phase === "intro") {
    return (
      <div className="text-center max-w-sm mx-auto">
        <h2 className="font-display text-2xl text-foreground">Cognitive flexibility</h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          A number appears with a rule above it. The rule keeps changing — answer as fast as you can without slipping
          into the old rule. About 40 seconds.
        </p>
        <button onClick={() => { start.current = Date.now(); setPhase("running"); }}
          className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }

  if (phase === "done") return null;

  const t = trials.current[i];
  const L = LABELS[t.rule];

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <p className="text-xs uppercase tracking-widest" style={{ color: L.color }}>{L.prompt}</p>
      <p className="mt-6 font-display text-8xl text-foreground tabular-nums">{t.num}</p>
      <div className="mt-12 flex gap-4">
        <button onClick={() => answer("a")}
          className="px-8 py-4 rounded-2xl border border-border text-sm text-foreground hover:border-foreground/40 transition-colors">{L.a}</button>
        <button onClick={() => answer("b")}
          className="px-8 py-4 rounded-2xl border border-border text-sm text-foreground hover:border-foreground/40 transition-colors">{L.b}</button>
      </div>
      <p className="mt-10 text-xs text-muted-foreground tabular-nums">{i + 1} / {ROUNDS}</p>
    </div>
  );
}