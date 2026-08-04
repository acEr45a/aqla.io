import React, { useEffect, useRef, useState } from "react";
import { playTone, playFeedback, unlockAudio } from "@/lib/gameAudio";

// Mnemora — Dual n-back (specialty, memory). Each step flashes a grid cell AND plays
// a tone. Judge whether the current cell matches the one N-back AND whether the tone
// matches N-back. Two independent judgments every step.
const N = 2;
const TRIALS = 22;
const TONES = [330, 392, 440, 523, 587, 659, 740, 831]; // 8 cells -> 8 tones
const GRID = 3;

export default function MnemoraGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const seq = useRef({ cells: [], tones: [] });
  const stats = useRef({ posHit: 0, posFA: 0, sndHit: 0, sndFA: 0, posTrials: 0, sndTrials: 0 });
  const answered = useRef({ pos: false, snd: false });
  const timer = useRef(null);

  const build = () => {
    const cells = [], tones = [];
    for (let i = 0; i < TRIALS; i++) {
      cells.push(Math.floor(Math.random() * GRID * GRID));
      tones.push(Math.floor(Math.random() * GRID * GRID));
    }
    for (let i = N; i < TRIALS; i += 4 + Math.floor(Math.random() * 3)) cells[i] = cells[i - N];
    for (let i = N; i < TRIALS; i += 5 + Math.floor(Math.random() * 3)) tones[i] = tones[i - N];
    seq.current = { cells, tones };
  };

  const showStep = (i) => {
    if (i >= TRIALS) {
      const s = stats.current;
      const posAcc = s.posTrials ? s.posHit / s.posTrials : 0;
      const sndAcc = s.sndTrials ? s.sndHit / s.sndTrials : 0;
      const score = Math.round(((posAcc + sndAcc) / 2) * 100);
      setPhase("done");
      onComplete({ raw: { ...s, trials: TRIALS, n: N }, score });
      return;
    }
    answered.current = { pos: false, snd: false };
    setStep(i);
    setActive(seq.current.cells[i]);
    playTone(TONES[seq.current.tones[i]], 0.18, 0.06);
    setOpen(true);
    timer.current = setTimeout(() => { setActive(-1); setOpen(false); showStep(i + 1); }, 2300);
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
      if (match) { stats.current.posHit++; playFeedback(true); } else { stats.current.posFA++; playFeedback(false); }
    } else {
      stats.current.sndTrials++;
      if (match) { stats.current.sndHit++; playTone(660, 0.1); } else { stats.current.sndFA++; playFeedback(false); }
    }
    answered.current[kind] = true;
  };

  const start = () => {
    unlockAudio();
    build();
    stats.current = { posHit: 0, posFA: 0, sndHit: 0, sndFA: 0, posTrials: 0, sndTrials: 0 };
    setPhase("running");
    showStep(0);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Mnemora</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          A square lights up and a tone plays each beat. After two steps, ask yourself: does this square match the one two beats ago? Does this tone match two beats ago? Judge each independently.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Dual {N}-back</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <div className="w-full text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Beat {Math.min(step + 1, TRIALS)} / {TRIALS} · {N}-back</p>
      <div className="mt-6 grid grid-cols-3 gap-2 max-w-[16rem] mx-auto">
        {Array.from({ length: GRID * GRID }, (_, i) => (
          <div key={i} className={`aspect-square rounded-xl border transition-colors ${active === i ? "border-primary bg-primary/30" : "border-border bg-secondary/30"}`} />
        ))}
      </div>
      <div className="mt-7 flex justify-center gap-3">
        <button onClick={() => judge("pos")} className="px-6 py-3 rounded-full border border-border text-sm text-foreground hover:border-primary/50">Position match</button>
        <button onClick={() => judge("snd")} className="px-6 py-3 rounded-full border border-border text-sm text-foreground hover:border-primary/50">Sound match</button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Tap a button only when the current beat matches the one {N} back.</p>
    </div>
  );
}