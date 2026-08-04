import React, { useEffect, useRef, useState } from "react";
import { playTone, playFeedback, unlockAudio } from "@/lib/gameAudio";

// Nexus — Multiple Object Tracking (specialty, focus). Several dots are flagged as
// targets, then all dots move together; at the end, tap the dots you believe were targets.
const ROUNDS = [
  { dots: 8, targets: 2 },
  { dots: 8, targets: 3 },
  { dots: 10, targets: 4 },
];
const SIZE = 300;
const MOVE_MS = 4200;
const HIGHLIGHT_MS = 1600;
const DOT_R = 16;

function makeDots(count, targets) {
  return Array.from({ length: count }, (_, i) => ({
    x: 40 + Math.random() * (SIZE - 80),
    y: 40 + Math.random() * (SIZE - 80),
    vx: (Math.random() - 0.5) * 2.4,
    vy: (Math.random() - 0.5) * 2.4,
    target: i < targets,
  }));
}

export default function NexusGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState("idle"); // highlight | move | choose
  const [picks, setPicks] = useState([]);
  const canvas = useRef(null);
  const dotsRef = useRef([]);
  const rafRef = useRef(null);
  const completed = useRef(0);

  const tick = () => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const d = dotsRef.current;
    for (const o of d) {
      o.x += o.vx; o.y += o.vy;
      if (o.x < DOT_R || o.x > SIZE - DOT_R) o.vx *= -1;
      if (o.y < DOT_R || o.y > SIZE - DOT_R) o.vy *= -1;
    }
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < d.length; i++) {
      ctx.beginPath();
      ctx.arc(d[i].x, d[i].y, DOT_R, 0, Math.PI * 2);
      ctx.fillStyle = "#6b7280";
      ctx.fill();
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const drawTargets = () => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const d = dotsRef.current;
    for (let i = 0; i < d.length; i++) {
      ctx.beginPath();
      ctx.arc(d[i].x, d[i].y, DOT_R, 0, Math.PI * 2);
      ctx.fillStyle = d[i].target ? "#C9F24E" : "#6b7280";
      ctx.fill();
      if (d[i].target) {
        ctx.beginPath();
        ctx.arc(d[i].x, d[i].y, DOT_R + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#C9F24E";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  };

  const beginRound = (i) => {
    if (i >= ROUNDS.length) {
      const score = Math.round((completed.current / ROUNDS.length) * 100);
      setPhase("done");
      onComplete({ raw: { completed: completed.current, rounds: ROUNDS.length }, score });
      return;
    }
    setRound(i);
    setPicks([]);
    dotsRef.current = makeDots(ROUNDS[i].dots, ROUNDS[i].targets);
    setStage("highlight");
    setTimeout(() => {
      setStage("move");
      rafRef.current = requestAnimationFrame(tick);
      setTimeout(() => {
        cancelAnimationFrame(rafRef.current);
        setStage("choose");
      }, MOVE_MS);
    }, HIGHLIGHT_MS);
  };

  const start = () => {
    unlockAudio();
    completed.current = 0;
    setPhase("running");
    beginRound(0);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useEffect(() => {
    if (stage === "highlight" && canvas.current) drawTargets();
  }, [stage, round]);

  const onCanvas = (e) => {
    if (stage !== "choose") return;
    const rect = canvas.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * SIZE;
    let nearest = -1, best = DOT_R * 2.2;
    dotsRef.current.forEach((o, i) => {
      const dist = Math.hypot(o.x - x, o.y - y);
      if (dist < best) { best = dist; nearest = i; }
    });
    if (nearest < 0 || picks.includes(nearest)) return;
    playTone(700, 0.06);
    const next = [...picks, nearest];
    setPicks(next);
    if (next.length >= ROUNDS[round].targets) {
      const d = dotsRef.current;
      const hit = next.filter((i) => d[i].target).length;
      if (hit / ROUNDS[round].targets >= 0.5) { completed.current++; playFeedback(true); } else playFeedback(false);
      setStage("reveal");
      setTimeout(() => beginRound(round + 1), 700);
    }
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Nexus</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The highlighted dots are your targets. They all scatter and move together — keep your eyes locked on every one. When they stop, tap the targets you tracked.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Multi-object tracking</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <div className="w-full text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Wave {round + 1} / {ROUNDS.length} · targets {ROUNDS[round].targets}</p>
      <p className="mt-2 text-xs text-primary">
        {stage === "highlight" ? "Mark your targets" : stage === "move" ? "Track them…" : `Tap ${ROUNDS[round].targets} targets (${picks.length} picked)`}
      </p>
      <canvas ref={canvas} width={SIZE} height={SIZE} onClick={onCanvas}
        className={`mt-4 rounded-2xl border border-border bg-secondary/20 ${stage === "choose" ? "cursor-crosshair" : ""}`} />
    </div>
  );
}