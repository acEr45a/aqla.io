import React, { useEffect, useRef, useState } from "react";
import { playFeedback, playTone, unlockAudio } from "@/lib/gameAudio";

// Maze Mind — route memory. A token traces a path across a grid from start to goal;
// the player must reproduce the exact move sequence from memory.
const GRID = 6;
const ROUNDS = [
  { len: 4 },
  { len: 6 },
  { len: 8 },
];

const DIRS = [
  { dx: 0, dy: -1, key: "U", label: "↑" },
  { dx: 0, dy: 1, key: "D", label: "↓" },
  { dx: -1, dy: 0, key: "L", label: "←" },
  { dx: 1, dy: 0, key: "R", label: "→" },
];

function buildPath(len) {
  let x = 0, y = 0;
  const moves = [];
  const visited = new Set([`${x},${y}`]);
  while (moves.length < len) {
    const opts = DIRS.filter((d) => {
      const nx = x + d.dx, ny = y + d.dy;
      return nx >= 0 && nx < GRID && ny >= 0 && ny < GRID && !visited.has(`${nx},${ny}`);
    });
    if (!opts.length) return buildPath(len);
    const d = opts[Math.floor(Math.random() * opts.length)];
    x += d.dx; y += d.dy;
    visited.add(`${x},${y}`);
    moves.push(d);
  }
  return { moves, goal: { x, y } };
}

export default function MazeMindGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [token, setToken] = useState({ x: 0, y: 0 });
  const [playerIdx, setPlayerIdx] = useState(0);
  const [showing, setShowing] = useState(false);
  const path = useRef(null);
  const completed = useRef(0);

  const playPath = (i) => {
    const cfg = path.current;
    setShowing(true);
    setToken({ x: 0, y: 0 });
    let idx = 0;
    const step = () => {
      if (idx >= cfg.moves.length) { setShowing(false); setPlayerIdx(0); setToken({ x: 0, y: 0 }); return; }
      setTimeout(() => {
        idx++;
        let cx = 0, cy = 0;
        for (let k = 0; k < idx; k++) { cx += cfg.moves[k].dx; cy += cfg.moves[k].dy; }
        setToken({ x: cx, y: cy });
        playTone(420 + idx * 30, 0.07);
        step();
      }, 520);
    };
    step();
  };

  const beginRound = (i) => {
    if (i >= ROUNDS.length) {
      const score = Math.round((completed.current / ROUNDS.length) * 100);
      setPhase("done");
      onComplete({ raw: { completed: completed.current, rounds: ROUNDS.length }, score });
      return;
    }
    setRound(i);
    path.current = buildPath(ROUNDS[i].len);
    setToken({ x: 0, y: 0 });
    playPath(i);
  };

  const start = () => {
    unlockAudio();
    completed.current = 0;
    setPhase("running");
    beginRound(0);
  };

  const move = (d) => {
    if (phase !== "running" || showing) return;
    const cfg = path.current;
    if (playerIdx >= cfg.moves.length) return;
    const expected = cfg.moves[playerIdx];
    const nx = token.x + d.dx, ny = token.y + d.dy;
    if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) { playFeedback(false); return; }
    const correct = d.key === expected.key;
    if (!correct) { playFeedback(false); }
    else { playTone(640, 0.06); }
    setToken({ x: nx, y: ny });
    const nextIdx = playerIdx + 1;
    setPlayerIdx(nextIdx);
    if (nextIdx >= cfg.moves.length) {
      if (correct) completed.current++;
      setTimeout(() => beginRound(round + 1), 500);
    }
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Maze Mind</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          A token walks a hidden route from the start square to a goal. Watch closely, then retrace the same moves from memory.
          Three routes, each longer than the last.
        </p>
        <button onClick={start} className="mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <div className="w-full text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Route {round + 1} / {ROUNDS.length} · {showing ? "watching" : `move ${playerIdx + 1} / ${path.current.moves.length}`}</p>
      <div className="mt-5 relative mx-auto grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID}, 2.4rem)`, gridTemplateRows: `repeat(${GRID}, 2.4rem)` }}>
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const x = i % GRID, y = Math.floor(i / GRID);
          const isToken = token.x === x && token.y === y;
          const isGoal = path.current.goal.x === x && path.current.goal.y === y;
          return (
            <div key={i} className={`rounded-md border border-border ${isGoal ? "bg-primary/25" : "bg-secondary/30"} flex items-center justify-center`}>
              {isGoal && <span className="w-2 h-2 rounded-full bg-primary" />}
              {isToken && <span className="w-3 h-3 rounded-full bg-foreground" />}
            </div>
          );
        })}
      </div>
      {!showing && (
        <div className="mt-6 grid grid-cols-3 gap-2 max-w-[10rem] mx-auto">
          <span />
          <button onClick={() => move(DIRS[0])} className="h-12 rounded-xl border border-border text-xl hover:border-primary/50">↑</button>
          <span />
          <button onClick={() => move(DIRS[2])} className="h-12 rounded-xl border border-border text-xl hover:border-primary/50">←</button>
          <button onClick={() => move(DIRS[1])} className="h-12 rounded-xl border border-border text-xl hover:border-primary/50">↓</button>
          <button onClick={() => move(DIRS[3])} className="h-12 rounded-xl border border-border text-xl hover:border-primary/50">→</button>
        </div>
      )}
    </div>
  );
}