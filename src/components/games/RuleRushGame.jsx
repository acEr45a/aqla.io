import React, { useEffect, useState } from "react";

export default function RuleRushGame({ onComplete }) {
  const [round, setRound] = useState(0); const [value, setValue] = useState(0); const [even, setEven] = useState(true); const [correct, setCorrect] = useState(0);
  const next = () => { setValue(Math.floor(Math.random() * 90) + 10); setEven(Math.random() > 0.5); };
  useEffect(() => { next(); }, []);
  useEffect(() => { if (round >= 15) onComplete({ raw: { correct, rounds: 15 }, score: Math.round((correct / 15) * 100) }); }, [round]);
  const answer = (yes) => { if (yes === ((value % 2 === 0) === even)) setCorrect((v) => v + 1); setRound((v) => v + 1); next(); };
  return <div className="text-center"><p className="text-xs text-muted-foreground">Round {Math.min(round + 1, 15)} / 15</p><p className="mt-8 text-sm text-muted-foreground">Is this number {even ? "even" : "odd"}?</p><p className="mt-3 text-7xl font-display text-foreground">{value}</p><div className="mt-8 flex justify-center gap-4"><button onClick={() => answer(true)} className="px-8 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium">Yes</button><button onClick={() => answer(false)} className="px-8 py-3 rounded-full border border-border text-sm">No</button></div></div>;
}