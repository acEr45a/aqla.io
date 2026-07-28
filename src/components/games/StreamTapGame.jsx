import React, { useEffect, useState } from "react";

export default function StreamTapGame({ onComplete }) {
  const [round, setRound] = useState(0); const [target, setTarget] = useState(0); const [hits, setHits] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started || round >= 18) return;
    const next = Math.floor(Math.random() * 9) + 1; setTarget(next);
    const timer = setTimeout(() => setRound((r) => r + 1), 950);
    return () => clearTimeout(timer);
  }, [started, round]);
  useEffect(() => { if (started && round >= 18) onComplete({ raw: { hits, rounds: 18 }, score: Math.round((hits / 18) * 100) }); }, [started, round]);
  if (!started) return <div className="text-center"><p className="text-sm text-muted-foreground">Tap the number that matches the target before it changes.</p><button onClick={() => setStarted(true)} className="mt-6 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button></div>;
  return <div className="text-center"><p className="text-xs text-muted-foreground">Round {Math.min(round + 1, 18)} / 18</p><p className="mt-6 text-7xl font-display text-primary">{target}</p><div className="mt-8 grid grid-cols-3 gap-3 max-w-xs mx-auto">{Array.from({ length: 9 }, (_, i) => i + 1).map((n) => <button key={n} onClick={() => { if (n === target) setHits((v) => v + 1); setRound((v) => v + 1); }} className="h-14 rounded-xl border border-border text-lg hover:border-primary">{n}</button>)}</div></div>;
}