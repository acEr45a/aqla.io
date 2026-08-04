import React, { useEffect, useRef, useState } from "react";
import { playTone, unlockAudio } from "@/lib/gameAudio";

// Word Forge — verbal fluency under tightening letter + time constraints.
const ROUNDS = [
  { letter: "S", category: "Animals", seconds: 22 },
  { letter: "B", category: "Things in a home", seconds: 20 },
  { letter: "M", category: "Jobs", seconds: 18 },
];

export default function WordForgeGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [words, setWords] = useState([]);
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const timer = useRef(null);

  const valid = (w) => w.trim().length > 2 && w[0].toUpperCase() === ROUNDS[round].letter && !words.includes(w.toLowerCase());

  const finish = (totals) => {
    const score = Math.min(100, Math.round((totals / 24) * 100));
    setPhase("done");
    onComplete({ raw: { total_words: totals, rounds: ROUNDS.length }, score });
  };

  const beginRound = (i) => {
    setRound(i);
    setWords([]);
    setText("");
    setSeconds(ROUNDS[i].seconds);
  };

  const start = () => {
    unlockAudio();
    setPhase("running");
    beginRound(0);
  };

  useEffect(() => {
    if (phase !== "running" || seconds <= 0) return;
    timer.current = setTimeout(() => setSeconds((v) => v - 1), 1000);
    return () => clearTimeout(timer.current);
  }, [phase, seconds]);

  useEffect(() => {
    if (phase !== "running" || seconds !== 0) return;
    if (round + 1 < ROUNDS.length) beginRound(round + 1);
    else finish(words.length);
  }, [phase, seconds]);

  const add = (e) => {
    e.preventDefault();
    const w = text.trim().toLowerCase();
    if (valid(w)) { setWords((v) => [...v, w]); playTone(680, 0.08); }
    setText("");
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Word Forge</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Three rounds. Each names a starting letter and a category — type as many fitting words as you can before the timer runs out.
          The clock tightens every round.
        </p>
        <button onClick={start} className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  const cfg = ROUNDS[round];
  return (
    <div className="w-full max-w-md text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Round {round + 1} / {ROUNDS.length}</p>
      <p className="mt-2 font-display text-3xl text-foreground">{cfg.category} · <span className="text-primary">“{cfg.letter}”</span></p>
      <p className="mt-3 font-display text-5xl text-primary tabular-nums">{seconds}s</p>
      <form onSubmit={add} className="mt-6 flex gap-2">
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={`a “${cfg.letter}” word`}
          className="flex-1 h-11 rounded-xl bg-secondary border border-border px-4 text-sm outline-none focus:border-primary/50" />
        <button className="px-4 rounded-xl bg-primary text-primary-foreground text-sm">Forge</button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">{words.length} forged</p>
      <p className="mt-2 text-xs text-muted-foreground/70 text-left break-words">{words.join(" · ")}</p>
    </div>
  );
}