import React, { useEffect, useRef, useState } from "react";
import { AudioLines } from "lucide-react";
import { playTone, unlockAudio } from "@/lib/gameAudio";

const ROUNDS = 20;
const TONES = [262, 330, 392, 523];
const makeSequence = () => {
  const sequence = [];
  for (let i = 0; i < ROUNDS; i++) {
    sequence.push(i > 0 && Math.random() < 0.32
      ? sequence[i - 1]
      : TONES[Math.floor(Math.random() * TONES.length)]);
  }
  return sequence;
};

export default function EchoChamberGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(0);
  const sequence = useRef(makeSequence());
  const responded = useRef(false);
  const stats = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });

  const finishRound = () => {
    if (idx > 0) {
      const match = sequence.current[idx] === sequence.current[idx - 1];
      if (match && responded.current) stats.current.hits++;
      else if (match) stats.current.misses++;
      else if (responded.current) stats.current.falseAlarms++;
      else stats.current.correctRejections++;
    }
    if (idx + 1 >= ROUNDS) {
      const s = stats.current;
      const score = Math.round(((s.hits + s.correctRejections) / (ROUNDS - 1)) * 100);
      setPhase("done");
      onComplete({ raw: { ...s, rounds: ROUNDS, mode: "auditory_1_back" }, score });
      return;
    }
    responded.current = false;
    setIdx((value) => value + 1);
    playTone(sequence.current[idx + 1], 0.34);
  };

  useEffect(() => {
    if (phase !== "running") return;
    const timer = setTimeout(finishRound, 1450);
    return () => clearTimeout(timer);
  }, [phase, idx]);

  const start = () => { unlockAudio(); setPhase("running"); playTone(sequence.current[0], 0.34); };
  const respond = () => { if (phase === "running") responded.current = true; };

  if (phase === "done") return null;
  if (phase === "intro") return <div className="max-w-sm mx-auto text-center"><AudioLines className="w-10 h-10 mx-auto text-primary" /><h2 className="mt-4 font-display text-2xl text-foreground">Echo Chamber</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Listen closely. Tap Echo when a tone is the same as the one immediately before it. Keep your eyes relaxed and focus on sound.</p><button onClick={start} className="mt-8 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground">Begin with sound</button></div>;
  return <button onPointerDown={respond} className="w-full h-full flex flex-col items-center justify-center" aria-label="Echo repeated tone"><span className="w-28 h-28 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center animate-pulse"><AudioLines className="w-12 h-12 text-primary" /></span><p className="mt-8 text-sm text-foreground">Tap Echo if the tone repeated</p><span className="mt-5 rounded-full border border-primary/50 px-7 py-3 text-sm text-primary">Echo</span><p className="mt-6 text-xs text-muted-foreground tabular-nums">{idx + 1} / {ROUNDS}</p></button>;
}