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

const speak = (text, options = {}) => new Promise((resolve) => {
  const voice = new SpeechSynthesisUtterance(text);
  voice.volume = options.volume ?? 1;
  voice.rate = options.rate ?? 0.92;
  voice.pitch = options.pitch ?? 1;
  voice.onend = resolve;
  voice.onerror = resolve;
  window.speechSynthesis.speak(voice);
});

async function speakWithProgressiveEcho(phrase, level) {
  const words = phrase.split(" ");
  const splitAt = Math.max(1, Math.ceil(words.length / 2));
  const clearPart = words.slice(0, splitAt).join(" ");
  const echoPart = words.length === 1 ? words : words.slice(splitAt);
  await speak(clearPart, { volume: 1, rate: 0.9 });

  for (let wordIndex = 0; wordIndex < echoPart.length; wordIndex++) {
    const severity = (wordIndex + 1) / echoPart.length;
    await speak(echoPart[wordIndex], { volume: 0.94, rate: 0.9 });
    const echoCount = 1 + Math.floor(severity * 2) + Math.floor(level / 3);
    for (let echo = 0; echo < echoCount; echo++) {
      const volume = Math.max(0.025, 0.48 * Math.pow(0.38, echo) * (1 - severity * 0.28));
      await speak(echoPart[wordIndex], {
        volume,
        rate: 0.98 + severity * 0.18 + echo * 0.08,
        pitch: Math.max(0.55, 0.94 - severity * 0.12 - echo * 0.08),
      });
    }
  }
}

export default function EchoChamberGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [level, setLevel] = useState(0);
  const [answer, setAnswer] = useState("");
  const playback = useRef(0);
  const input = useRef(null);

  useEffect(() => { if (phase === "input") input.current?.focus(); }, [phase]);
  useEffect(() => () => {
    playback.current += 1;
    window.speechSynthesis?.cancel();
  }, []);

  const playLevel = async (nextLevel) => {
    window.speechSynthesis.cancel();
    const playbackId = ++playback.current;
    setLevel(nextLevel);
    setAnswer("");
    setPhase("listening");
    await speakWithProgressiveEcho(PHRASES[nextLevel], nextLevel);
    if (playbackId === playback.current) setPhase("input");
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
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Type exactly what you hear. Each phrase begins clearly, then its second half develops deeper echoes that fade exponentially and worsen toward the end. Your run ends when the message is lost.</p>
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