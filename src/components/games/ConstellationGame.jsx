import React, { useEffect, useRef, useState } from "react";
import { playTone, playFeedback, unlockAudio } from "@/lib/gameAudio";

// Constellation — pattern memory + mental rotation (specialty, spatial). A set of
// stars lights up forming a constellation, the board flashes a quarter-turn clockwise,
// then you re-place every star where it lands after that rotation. Five rounds with
// connecting star-lines, glow, and partial credit.
const GRID = 5;
const ROUNDS = [
  { stars: 4, showMs: 2600 },
  { stars: 5, showMs: 2800 },
  { stars: 6, showMs: 3000 },
  { stars: 7, showMs: 3200 },
  { stars: 8, showMs: 3400 },
];
const TURN_MS = 700;

function makePattern(stars) {
  const cells = new Set();
  while (cells.size < stars) cells.add(Math.floor(Math.random() * GRID * GRID));
  return [...cells];
}

function rotateCell(idx) {
  const x = idx % GRID, y = Math.floor(idx / GRID);
  return ((GRID - 1) - y) * GRID + x;
}
function cellXY(idx) {
  return { x: idx % GRID, y: Math.floor(idx / GRID) };
}

export default function ConstellationGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [lit, setLit] = useState([]);
  const [picks, setPicks] = useState([]);
  const [stage, setStage] = useState("idle");
  const [spin, setSpin] = useState(false);
  const [flash, setFlash] = useState(null);
  const patternRef = useRef([]);
  const targetRef = useRef([]);
  const completed = useRef(0);
  const accRef = useRef(0);
  const timer = useRef(null);

  const beginRound = (i) => {
    if (i >= ROUNDS.length) {
      const total = ROUNDS.reduce((s, r) => s + r.stars, 0);
      const score = Math.round((accRef.current / total) * 100);
      setPhase("done");
      onComplete({ raw: { completed: completed.current, rounds: ROUNDS.length, accuracy: score }, score });
      return;
    }
    setRound(i);
    setPicks([]);
    patternRef.current = makePattern(ROUNDS[i].stars);
    targetRef.current = patternRef.current.map(rotateCell);
    setLit(patternRef.current);
    setStage("show");
    timer.current = setTimeout(() => {
      setLit([]);
      setStage("turn");
      setSpin(true);
      playTone(500, 0.14, 0.05);
      timer.current = setTimeout(() => {
        setSpin(false);
        setStage("choose");
      }, TURN_MS);
    }, ROUNDS[i].showMs);
  };

  const start = () => {
    unlockAudio();
    completed.current = 0; accRef.current = 0;
    setPhase("running");
    beginRound(0);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const tapCell = (idx) => {
    if (stage !== "choose") return;
    if (picks.includes(idx)) return;
    const ok = targetRef.current.includes(idx);
    playTone(ok ? 760 : 260, 0.06);
    setFlash({ idx, ok });
    setTimeout(() => setFlash(null), 220);
    const next = [...picks, idx];
    setPicks(next);
    if (next.length >= ROUNDS[round].stars) {
      const hit = next.filter((c) => targetRef.current.includes(c)).length;
      accRef.current += hit;
      if (hit / ROUNDS[round].stars >= 0.75) { completed.current++; playFeedback(true); }
      else playFeedback(false);
      setStage("reveal");
      timer.current = setTimeout(() => beginRound(round + 1), 1400);
    }
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Constellation</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Stars light up across the grid forming a constellation — memorise them. The board flashes a quarter turn clockwise. Re-place every star where it lands after the rotation. Five maps, growing star counts.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Mental rotation + memory</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  // build SVG lines connecting lit stars for constellation feel
  const lines = [];
  if (stage === "show" && lit.length > 1) {
    const pts = lit.map(cellXY);
    for (let k = 0; k < pts.length - 1; k++) {
      lines.push({ x1: pts[k].x, y1: pts[k].y, x2: pts[k + 1].x, y2: pts[k + 1].y });
    }
  }

  return (
    <div className="w-full text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Star map {round + 1} / {ROUNDS.length} · {ROUNDS[round].stars} stars</p>
      <p className="mt-2 text-xs text-primary h-4">
        {stage === "show" ? "Memorise the constellation"
          : stage === "turn" ? "Turning 90° clockwise…"
          : stage === "choose" ? `Place ${ROUNDS[round].stars} stars after the turn · ${picks.length} set`
          : "Revealing the true positions…"}
      </p>
      <div className="mt-5 mx-auto relative" style={{ width: 290, height: 290 }}>
        <div className={`w-full h-full transition-transform duration-600 ease-out ${spin ? "rotate-90 scale-90" : "rotate-0 scale-100"}`}>
          <div className="grid gap-1.5 w-full h-full relative" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
            {Array.from({ length: GRID * GRID }, (_, idx) => {
              const isLit = lit.includes(idx);
              const isPicked = picks.includes(idx);
              const isTarget = stage === "reveal" && targetRef.current.includes(idx);
              const isFlash = flash?.idx === idx;
              return (
                <button key={idx} onClick={() => tapCell(idx)} disabled={stage !== "choose"}
                  className={`rounded-lg border flex items-center justify-center transition-all duration-200 ${
                    isLit ? "bg-primary/15 border-primary/40"
                    : isTarget ? "bg-chart-2/30 border-chart-2/60"
                    : isPicked ? "bg-primary/25 border-primary/60"
                    : "bg-secondary/20 border-border/60"}`}>
                  {isLit && (
                    <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_18px_rgba(201,242,78,0.7)] animate-pulse" />
                  )}
                  {isPicked && !isLit && (
                    <span className="w-3 h-3 rounded-full bg-primary/80" />
                  )}
                  {isTarget && (
                    <span className="w-3 h-3 rounded-full bg-chart-2 shadow-[0_0_18px_rgba(123,148,255,0.7)]" />
                  )}
                  {isFlash && (
                    <span className={`absolute inset-0 rounded-lg ${flash.ok ? "bg-primary/30" : "bg-destructive/30"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {stage === "show" && lines.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none" viewBox={`0 0 ${GRID - 1} ${GRID - 1}`} preserveAspectRatio="none">
            {lines.map((l, k) => (
              <line key={k} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="rgba(201,242,78,0.4)" strokeWidth="0.05" />
            ))}
          </svg>
        )}
      </div>
      {stage === "reveal" && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="text-chart-2">Blue</span> = true rotated positions · <span className="text-primary">Green</span> = your picks
        </p>
      )}
    </div>
  );
}