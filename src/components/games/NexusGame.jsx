import React, { useEffect, useRef, useState } from "react";
import { playTone, playFeedback, unlockAudio } from "@/lib/gameAudio";

// Nexus — Multiple Object Tracking (specialty, focus). Targets flash, then all
// dots scatter and bounce together; pick the targets you tracked. Adaptive waves,
// neon glow, motion trails, and partial-credit scoring.
const ROUNDS = [
  { dots: 8, targets: 2, speed: 1.6, moveMs: 4200 },
  { dots: 10, targets: 3, speed: 1.9, moveMs: 4800 },
  { dots: 12, targets: 4, speed: 2.2, moveMs: 5400 },
  { dots: 14, targets: 5, speed: 2.5, moveMs: 5800 },
  { dots: 16, targets: 6, speed: 2.8, moveMs: 6200 },
];
const SIZE = 360;
const HIGHLIGHT_MS = 1700;
const DOT_R = 15;
const TRAIL_LEN = 8;

function makeDots(count, targets, speed) {
  const placed = [];
  while (placed.length < count) {
    const x = 40 + Math.random() * (SIZE - 80);
    const y = 40 + Math.random() * (SIZE - 80);
    if (placed.every((p) => Math.hypot(p.x - x, p.y - y) > DOT_R * 3)) {
      placed.push({
        x, y,
        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 0.5) * speed * 2,
        target: placed.length < targets,
        trail: [],
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }
  return placed;
}

export default function NexusGame({ onComplete }) {
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState("idle");
  const [picks, setPicks] = useState([]);
  const [flash, setFlash] = useState(null);
  const canvas = useRef(null);
  const dotsRef = useRef([]);
  const rafRef = useRef(null);
  const completed = useRef(0);
  const accRef = useRef(0);

  const render = (highlight) => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const d = dotsRef.current;
    ctx.clearRect(0, 0, SIZE, SIZE);
    // soft field grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let g = 0; g <= SIZE; g += 40) {
      ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(SIZE, g); ctx.stroke();
    }
    for (let i = 0; i < d.length; i++) {
      const o = d[i];
      const isTarget = highlight && o.target;
      const isPicked = picks.includes(i);
      // trail
      for (let t = 0; t < o.trail.length; t++) {
        const a = (t / o.trail.length) * 0.25;
        ctx.beginPath();
        ctx.arc(o.trail[t].x, o.trail[t].y, DOT_R * (t / o.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = isTarget ? `rgba(201,242,78,${a})` : `rgba(120,130,150,${a})`;
        ctx.fill();
      }
      const pulseR = DOT_R + (highlight ? Math.sin(o.pulse) * 1.5 : 0);
      // glow
      if (isTarget || isPicked) {
        const g = ctx.createRadialGradient(o.x, o.y, DOT_R, o.x, o.y, DOT_R + 18);
        g.addColorStop(0, isPicked ? "rgba(201,242,78,0.5)" : "rgba(201,242,78,0.35)");
        g.addColorStop(1, "rgba(201,242,78,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, DOT_R + 18, 0, Math.PI * 2); ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(o.x, o.y, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = isPicked ? "#C9F24E" : isTarget ? "#C9F24E" : "#6b7280";
      ctx.fill();
      if (isTarget && highlight) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, DOT_R + 7, 0, Math.PI * 2);
        ctx.strokeStyle = "#C9F24E"; ctx.lineWidth = 2.5; ctx.stroke();
      }
    }
  };

  const tick = () => {
    const d = dotsRef.current;
    for (const o of d) {
      o.x += o.vx; o.y += o.vy;
      if (o.x < DOT_R) { o.x = DOT_R; o.vx = Math.abs(o.vx); }
      if (o.x > SIZE - DOT_R) { o.x = SIZE - DOT_R; o.vx = -Math.abs(o.vx); }
      if (o.y < DOT_R) { o.y = DOT_R; o.vy = Math.abs(o.vy); }
      if (o.y > SIZE - DOT_R) { o.y = SIZE - DOT_R; o.vy = -Math.abs(o.vy); }
      o.pulse += 0.12;
      o.trail.unshift({ x: o.x, y: o.y });
      if (o.trail.length > TRAIL_LEN) o.trail.pop();
    }
    render(false);
    rafRef.current = requestAnimationFrame(tick);
  };

  const beginRound = (i) => {
    if (i >= ROUNDS.length) {
      const score = Math.round((accRef.current / ROUNDS.reduce((s, r) => s + r.targets, 0)) * 100);
      setPhase("done");
      onComplete({ raw: { completed: completed.current, rounds: ROUNDS.length, accuracy: score }, score });
      return;
    }
    setRound(i);
    setPicks([]);
    dotsRef.current = makeDots(ROUNDS[i].dots, ROUNDS[i].targets, ROUNDS[i].speed);
    setStage("highlight");
    setTimeout(() => {
      render(true);
      setStage("move");
      rafRef.current = requestAnimationFrame(tick);
      setTimeout(() => {
        cancelAnimationFrame(rafRef.current);
        render(true);
        setStage("choose");
      }, ROUNDS[i].moveMs);
    }, HIGHLIGHT_MS);
  };

  const start = () => {
    unlockAudio();
    completed.current = 0; accRef.current = 0;
    setPhase("running");
    beginRound(0);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useEffect(() => {
    if (stage === "highlight" && canvas.current) render(true);
  }, [stage, round, picks]);

  const onCanvas = (e) => {
    if (stage !== "choose") return;
    const rect = canvas.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * SIZE;
    let nearest = -1, best = DOT_R * 2.4;
    dotsRef.current.forEach((o, i) => {
      const dist = Math.hypot(o.x - x, o.y - y);
      if (dist < best) { best = dist; nearest = i; }
    });
    if (nearest < 0 || picks.includes(nearest)) return;
    const d = dotsRef.current;
    const correct = d[nearest].target;
    playTone(correct ? 880 : 220, 0.07);
    setFlash({ i: nearest, ok: correct });
    const next = [...picks, nearest];
    setPicks(next);
    setTimeout(() => setFlash(null), 250);
    if (next.length >= ROUNDS[round].targets) {
      const hit = next.filter((idx) => d[idx].target).length;
      const targets = ROUNDS[round].targets;
      accRef.current += hit;
      if (hit / targets >= 0.6) { completed.current++; playFeedback(true); }
      else playFeedback(false);
      setStage("reveal");
      // reveal true targets
      d.forEach((o) => { if (o.target) o.trail = []; });
      render(true);
      setTimeout(() => beginRound(round + 1), 1100);
    }
  };

  if (phase === "intro") {
    return (
      <div className="max-w-sm mx-auto text-center">
        <h2 className="font-display text-2xl text-foreground">Nexus</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The glowing dots are your targets. They scatter and bounce through a field of distractors — keep your eyes locked on every one. When they stop, tap each target you tracked. Five adaptive waves.
        </p>
        <p className="mt-2 text-xs text-primary tracking-wide">Specialty · Multi-object tracking</p>
        <button onClick={start} className="mt-7 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Begin</button>
      </div>
    );
  }
  if (phase === "done") return null;

  return (
    <div className="w-full text-center">
      <p className="text-xs text-muted-foreground tabular-nums">Wave {round + 1} / {ROUNDS.length} · {ROUNDS[round].targets} targets among {ROUNDS[round].dots}</p>
      <p className="mt-2 text-xs text-primary h-4">
        {stage === "highlight" ? "Mark your targets"
          : stage === "move" ? "Track them…"
          : stage === "choose" ? `Tap ${ROUNDS[round].targets} targets · ${picks.length} picked`
          : "Revealing…"}
      </p>
      <canvas ref={canvas} width={SIZE} height={SIZE} onClick={onCanvas}
        className={`mt-4 rounded-2xl border border-border bg-secondary/20 mx-auto block ${stage === "choose" ? "cursor-crosshair" : ""}`} />
      {flash && (
        <p className="mt-2 text-xs tabular-nums" style={{ color: flash.ok ? "#C9F24E" : "#F26B5E" }}>
          {flash.ok ? "Target locked" : "Not a target"}
        </p>
      )}
    </div>
  );
}