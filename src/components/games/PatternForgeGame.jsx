import React, { useEffect, useState } from "react";

const freshPattern = () => Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
export default function PatternForgeGame({ onComplete }) {
  const [pattern, setPattern] = useState(freshPattern); const [input, setInput] = useState([]); const [showing, setShowing] = useState(false); const [round, setRound] = useState(0); const [wins, setWins] = useState(0);
  useEffect(() => { if (round >= 8) onComplete({ raw: { wins, rounds: 8 }, score: Math.round((wins / 8) * 100) }); }, [round]);
  const play = () => { setShowing(true); setTimeout(() => setShowing(false), 1600); };
  const choose = (n) => { const next = [...input, n]; if (next.length < pattern.length) return setInput(next); const won = next.every((v, i) => v === pattern[i]); setWins((v) => v + (won ? 1 : 0)); setInput([]); setPattern(freshPattern()); setRound((v) => v + 1); };
  return <div className="text-center"><p className="text-xs text-muted-foreground">Pattern {Math.min(round + 1, 8)} / 8</p><p className="mt-3 text-sm text-muted-foreground">{showing ? "Memorise the glowing sequence" : "Rebuild the sequence"}</p><div className="mt-7 grid grid-cols-2 gap-3 max-w-xs mx-auto">{["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"].map((c, i) => <button key={c} onClick={() => !showing && choose(i)} className={`h-24 rounded-2xl ${c} ${showing && pattern.includes(i) ? "ring-4 ring-foreground scale-95" : "opacity-70"}`} />)}</div>{!showing && <button onClick={play} className="mt-6 text-xs text-primary">Show pattern again</button>}</div>;
}