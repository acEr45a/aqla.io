import React, { useEffect, useRef, useState } from "react";
import { playTone, playFeedback, unlockAudio } from "@/lib/gameAudio";

// Constellation — pattern memory + mental rotation (specialty, spatial). A set of
// stars lights up, the board flashes a quarter-turn, then you re-place every star where
// it would land after a 90° clockwise rotation — on the same upright grid.
const GRID = 5;
const ROUNDS = [
  { stars: 4 },
  { stars: 5 },
  { stars: 6 },
];
const SHOW_MS = 2600;
const TURN_MS = 650;

function makePattern(stars) {
  const cells = new Set();
  while (cells.size < stars) cells.add(Math.floor(Math.random() * GRID * GRID));
  return [...cells];
}

// rotate a cell index 90° clockwise on an upright grid
function rotateCell(idx) {
  const x = idx % GRID, y = Math.floor(idx / GRID);
  const rx = (GRID - 1) - y;
  const ry = x;
  return ry * GRID + rx;
}

export default function ConstellationGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [lit, setLit] = useState([]);
  const [picks, setPicks] = useState([]);
  const [stage, setStage] = useState("idle"); // show | turn | choose | reveal
  const [spin, setSpin] = useState(false);
  const patternRef = useRef([]);
  const targetRef = useRef([]);
  const completed = useRef(0);
  const timer = useRef(null);

  const beginRound = (i) => {
    if (i >= ROUNDS.length) {
      const score = Math.round((completed.current / ROUNDS.length) * 100);
      setPhase("done");
      onComplete({ raw: { completed: completed.current, rounds: ROUNDS.length }, score });
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
      playTone(500, 0.12, 0.05);
      timer.current = setTimeout(() => {
        setSpin(false);
        setStage("choose");
      }, TURN_MS);
    }, SHOW_MS);
  };

  const start = () => {
    unlockAudio();
    completed.current = 0;
    setPhase("running");
    beginRound(0);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const tapCell = (idx) => {
    if (stage !== "choose") return;
    if (picks.includes(idx)) return;
    playTone(560, 0.05);
    const next = [...picks, idx];
    setPicks(next);
    if (next.length >= ROUNDS[round].stars) {
      const hit = next.filter((c) => targetRef.current.includes(c)).length;
      if (hit / ROUNDS[round].stars >= 0.8) { completed.current++; playFeedback(true); } else playFeedback(false);
      setStage("reveal");
      timer.current = setTimeout(() => beginRound(round + 1), 1200);
    }
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Constellation</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Stars light up across the grid — memorise them. The board then flashes a quarter turn clockwise. Re-place every star where it would land after that rotation.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Mental rotation + memory</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <div className="w-full text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Star map {round + 1} / {ROUNDS.length} · {ROUNDS[round].stars} stars</p>
      <p className="mt-2 text-xs text-primary">
        {stage === "show" ? "Memorise the constellation"
          : stage === "turn" ? "Turning 90° clockwise…"
          : stage === "choose" ? `Place ${ROUNDS[round].stars} stars after the turn (${picks.length} set)`
          : "Revealing…"}
      </p>
      <div className="mt-5 mx-auto" style={{ width: 280, height: 280 }}>
        <div className={`w-full h-full transition-transform duration-500 ease-out ${spin ? "rotate-90 scale-95" : "rotate-0 scale-100"}`}>
          <div className="grid gap-1.5 w-full h-full" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
            {Array.from({ length: GRID * GRID }, (_, idx) => {
              const isLit = lit.includes(idx);
              const isPicked = picks.includes(idx);
              const isTarget = stage === "reveal" && targetRef.current.includes(idx);
              return (
                <button key={idx} onClick={() => tapCell(idx)} disabled={stage !== "choose"}
                  className={`rounded-lg border flex items-center justify-center transition-colors ${
                    isLit ? "bg-primary/70 border-primary"
                    : isTarget ? "bg-chart-2/40 border-chart-2/60"
                    : isPicked ? "bg-primary/30 border-primary/50"
                    : "bg-secondary/30 border-border"}`}>
                  {(isLit || isPicked) && <span className="w-2.5 h-2.5 rounded-full bg-foreground" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {stage === "reveal" && <p className="mt-3 text-xs text-muted-foreground">Gold marks the true rotated positions.</p>}
    </div>
  );
}