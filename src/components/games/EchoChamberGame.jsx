import React, { useEffect, useRef, useState } from "react";
import { AudioLines } from "lucide-react";

const PHRASES = [
  "focus",
  "silver signal",
  "quiet orbit",
  "memory follows rhythm",
  "attention holds the line",
  "find the signal through noise",
  "steady minds notice small changes",
  "follow the pattern beneath the echo",
  "clarity remains when distractions fade",
  "hold the message as the echoes disappear",
];

const clean = (value) => value.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");

export default function EchoChamberGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [level, setLevel] = useState(0);
  const [answer, setAnswer] = useState("");
  const timer = useRef(null);
  const input = useRef(null);

  useEffect(() => { if (phase === "input") input.current?.focus(); }, [phase]);
  useEffect(() => () => {
    clearTimeout(timer.current);
    window.speechSynthesis?.cancel();
  }, []);

  const playLevel = (nextLevel) => {
    window.speechSynthesis.cancel();
    setLevel(nextLevel);
    setAnswer("");
    setPhase("listening");
    const phrase = PHRASES[nextLevel];
    const echoes = nextLevel + 2;
    for (let i = 0; i < echoes; i++) {
      const voice = new SpeechSynthesisUtterance(phrase);
      voice.rate = 0.9 + i * 0.055;
      voice.pitch = Math.max(0.55, 1 - i * 0.045);
      voice.volume = Math.max(0.08, 0.9 - nextLevel * 0.065 - i * 0.075);
      window.speechSynthesis.speak(voice);
    }
    timer.current = setTimeout(() => setPhase("input"), 900 + echoes * 620);
  };

  const submit = (event) => {
    event.preventDefault();
    if (clean(answer) !== clean(PHRASES[level])) {
      setPhase("done");
      onComplete({
        raw: { completed_levels: level, failed_level: level + 1, mode: "progressive_echo_transcription" },
        score: Math.round((level / PHRASES.length) * 100),
      });
      return;
    }
    if (level + 1 >= PHRASES.length) {
      setPhase("done");
      onComplete({ raw: { completed_levels: PHRASES.length, mode: "progressive_echo_transcription" }, score: 100 });
      return;
    }
    playLevel(level + 1);
  };

  if (phase === "done") return null;
  if (phase === "intro") return (
    <div className="max-w-sm mx-auto text-center">
      <AudioLines className="w-10 h-10 mx-auto text-primary" />
      <h2 className="mt-4 font-display text-2xl text-foreground">Echo Chamber</h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Type exactly what you hear. Each level adds more echoes while the voice gets quieter and the phrase gets longer. Your run ends when the message is lost.</p>
      <p className="mt-3 text-xs text-muted-foreground">Headphones recommended.</p>
      <button onClick={() => playLevel(0)} className="mt-8 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground">Enter the chamber</button>
    </div>
  );
  return (
    <form onSubmit={submit} className="max-w-sm mx-auto text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Echo depth {level + 1} / {PHRASES.length}</p>
      <span className={`mt-7 mx-auto w-28 h-28 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center ${phase === "listening" ? "animate-pulse" : ""}`}>
        <AudioLines className="w-12 h-12 text-primary" />
      </span>
      <p className="mt-6 text-sm text-muted-foreground">{phase === "listening" ? "Listen through the echoes…" : "What did you hear?"}</p>
      <input ref={input} value={answer} disabled={phase === "listening"} onChange={(event) => setAnswer(event.target.value)} placeholder="Type the message" className="mt-5 w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-center text-foreground outline-none focus:border-primary/60 disabled:opacity-40" />
      <button type="submit" disabled={phase !== "input" || !answer.trim()} className="mt-5 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground disabled:opacity-30">Submit transcription</button>
    </form>
  );
}