import React, { useEffect, useRef, useState } from "react";
import { playTone, playFeedback, unlockAudio } from "@/lib/gameAudio";

// Mnemora — Dual n-back (specialty, memory). Each beat flashes a grid cell AND plays
// a tone. Judge whether the current cell matches the one N-back AND whether the tone
// matches N-back — two independent judgments every beat. 30 trials, live accuracy,
// streak meter, and rich hit/miss feedback.
const N = 2;
const TRIALS = 30;
const TONES = [330, 392, 440, 523, 587, 659, 740, 831];
const GRID = 3;
const BEAT_MS = 2400;

export default function MnemoraGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState({ pos: null, snd: null });
  const [streak, setStreak] = useState(0);
  const [progress, setProgress] = useState(0);
  const seq = useRef({ cells: [], tones: [] });
  const stats = useRef({ posHit: 0, posFA: 0, posMiss: 0, sndHit: 0, sndFA: 0, sndMiss: 0, posTrials: 0, sndTrials: 0 });
  const answered = useRef({ pos: false, snd: false });
  const streakRef = useRef(0);
  const timer = useRef(null);
  const beatStart = useRef(0);
  const raf = useRef(null);

  const build = () => {
    const cells = [], tones = [];
    for (let i = 0; i < TRIALS; i++) {
      cells.push(Math.floor(Math.random() * GRID * GRID));
      tones.push(Math.floor(Math.random() * GRID * GRID));
    }
    // ~30% position matches, ~30% sound matches
    for (let i = N; i < TRIALS; i += 3 + Math.floor(Math.random() * 2)) cells[i] = cells[i - N];
    for (let i = N; i < TRIALS; i += 3 + Math.floor(Math.random() * 2)) tones[i] = tones[i - N];
    seq.current = { cells, tones };
  };

  const showStep = (i) => {
    if (i >= TRIALS) {
      const s = stats.current;
      const posAcc = s.posTrials ? (s.posHit + s.posMiss) / s.posTrials : 0;
      const sndAcc = s.sndTrials ? (s.sndHit + s.sndMiss) / s.sndTrials : 0;
      // signal-detection style: hits minus false alarms
      const posSignal = s.posTrials ? s.posHit / s.posTrials - s.posFA / Math.max(1, s.posTrials - (s.posHit + s.posMiss)) : 0;
      const sndSignal = s.sndTrials ? s.sndHit / s.sndTrials - s.sndFA / Math.max(1, s.sndTrials - (s.sndHit + s.sndMiss)) : 0;
      const score = Math.round(Math.max(0, ((posSignal + sndSignal) / 2)) * 100);
      setPhase("done");
      onComplete({ raw: { ...s, trials: TRIALS, n: N, posAcc: +posAcc.toFixed(2), sndAcc: +sndAcc.toFixed(2) }, score });
      return;
    }
    answered.current = { pos: false, snd: false };
    setStep(i);
    setFlash({ pos: null, snd: null });
    setActive(seq.current.cells[i]);
    playTone(TONES[seq.current.tones[i]], 0.2, 0.05);
    setOpen(true);
    beatStart.current = performance.now();
    setProgress(0);
    const tickP = () => {
      const e = performance.now() - beatStart.current;
      setProgress(Math.min(1, e / BEAT_MS));
      if (e >= BEAT_MS) { raf.current = null; return; }
      raf.current = requestAnimationFrame(tickP);
    };
    raf.current = requestAnimationFrame(tickP);
    timer.current = setTimeout(() => {
      setActive(-1); setOpen(false);
      // count missed matches as misses
      if (i >= N) {
        if (!answered.current.pos) {
          const arr = seq.current.cells;
          if (arr[i] === arr[i - N]) { stats.current.posMiss++; stats.current.posTrials++; streakRef.current = 0; setStreak(0); }
        }
        if (!answered.current.snd) {
          const arr = seq.current.tones;
          if (arr[i] === arr[i - N]) { stats.current.sndMiss++; stats.current.posTrials; streakRef.current = 0; setStreak(0); }
        }
      }
      showStep(i + 1);
    }, BEAT_MS);
  };

  const judge = (kind) => {
    if (phase !== "running" || !open) return;
    if (answered.current[kind]) return;
    const i = step;
    if (i < N) { answered.current[kind] = true; return; }
    const arr = kind === "pos" ? seq.current.cells : seq.current.tones;
    const match = arr[i] === arr[i - N];
    if (kind === "pos") {
      stats.current.posTrials++;
      if (match) { stats.current.posHit++; streakRef.current++; setStreak(streakRef.current); playFeedback(true); }
      else { stats.current.posFA++; streakRef.current = 0; setStreak(0); playFeedback(false); }
      setFlash((f) => ({ ...f, pos: match ? "hit" : "fa" }));
    } else {
      stats.current.sndTrials++;
      if (match) { stats.current.sndHit++; streakRef.current++; setStreak(streakRef.current); playTone(880, 0.12); }
      else { stats.current.sndFA++; streakRef.current = 0; setStreak(0); playFeedback(false); }
      setFlash((f) => ({ ...f, snd: match ? "hit" : "fa" }));
    }
    answered.current[kind] = true;
  };

  const start = () => {
    unlockAudio();
    build();
    stats.current = { posHit: 0, posFA: 0, posMiss: 0, sndHit: 0, sndFA: 0, sndMiss: 0, posTrials: 0, sndTrials: 0 };
    streakRef.current = 0; setStreak(0);
    setPhase("running");
    showStep(0);
  };

  useEffect(() => () => { clearTimeout(timer.current); cancelAnimationFrame(raf.current); }, []);

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Mnemora</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          A square lights up and a tone plays each beat. After two beats, ask yourself: does this square match the one two beats ago? Does this tone match two beats ago? Judge each independently — only press when there's a match. {TRIALS} beats.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Dual {N}-back</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  const btn = (kind, label) => {
    const f = flash[kind];
    return (
      <button onClick={() => judge(kind)}
        className={`px-6 py-3 rounded-full border text-sm font-medium transition-all ${
          f === "hit" ? "border-primary bg-primary/20 text-primary"
          : f === "fa" ? "border-destructive bg-destructive/15 text-destructive"
          : "border-border text-foreground hover:border-primary/50"}`}>
        {label}
      </button>
    );
  };

  return (
    <div className="w-full text-center">
      <div className="flex items-center justify-between max-w-[18rem] mx-auto">
        <p className="text-xs text-muted-foreground tabular-nums">Beat {Math.min(step + 1, TRIALS)} / {TRIALS}</p>
        <p className="text-xs text-primary tabular-nums">streak {streak}</p>
      </div>
      <div className="mt-2 w-44 mx-auto h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary/60" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 max-w-[16rem] mx-auto">
        {Array.from({ length: GRID * GRID }, (_, i) => (
          <div key={i} className={`aspect-square rounded-xl border transition-all duration-150 ${
            active === i ? "border-primary bg-primary/30 scale-105 shadow-[0_0_24px_rgba(201,242,78,0.35)]" : "border-border bg-secondary/30"}`}>
            {active === i && <div className="w-full h-full rounded-xl bg-primary/40 animate-pulse" />}
          </div>
        ))}
      </div>
      <div className="mt-7 flex justify-center gap-3">
        {btn("pos", "Position match")}
        {btn("snd", "Sound match")}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Tap a button only when the current beat matches the one {N} back.</p>
    </div>
  );
}