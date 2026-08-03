import React, { useEffect, useRef } from "react";
import { getPerfSettings } from "@/utils/deviceBenchmark";

// Generate a randomized jagged lightning path from top to bottom of the screen,
// with branching offshoots — like a neuron firing an electrical signal.
function generateLightning(width, height, numBranches) {
  const segments = [];

  // Main bolt — jagged vertical path
  const startX = width * (0.15 + Math.random() * 0.7);
  const endX = width * (0.15 + Math.random() * 0.7);
  const numJoints = 16 + Math.floor(Math.random() * 10);
  const points = [{ x: startX, y: 0 }];

  for (let i = 1; i < numJoints; i++) {
    const t = i / numJoints;
    const baseX = startX + (endX - startX) * t;
    const jitter = (Math.random() - 0.5) * width * 0.22;
    const y = height * t + (Math.random() - 0.5) * height * 0.04;
    points.push({ x: baseX + jitter, y: Math.max(0, Math.min(height, y)) });
  }
  points.push({ x: endX, y: height });
  segments.push({ points, width: 2.5 });

  // Branches — smaller jagged offshoots from random joints
  for (let b = 0; b < numBranches; b++) {
    const idx = Math.floor(Math.random() * (points.length - 3)) + 1;
    const src = points[idx];
    const branchLen = 4 + Math.floor(Math.random() * 6);
    const branchPts = [{ x: src.x, y: src.y }];
    let bx = src.x;
    let by = src.y;
    const angle = (Math.random() - 0.5) * Math.PI * 0.7;
    for (let j = 0; j < branchLen; j++) {
      bx += Math.cos(angle) * (15 + Math.random() * 40) + (Math.random() - 0.5) * 25;
      by += Math.abs(Math.sin(angle)) * (15 + Math.random() * 35) + Math.random() * 25;
      branchPts.push({ x: bx, y: by });
    }
    segments.push({ points: branchPts, width: 1.2 });
  }

  return segments;
}

export default function SignalPath({ triggerRef }) {
  const canvasRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const trigger = triggerRef?.current;
    if (!canvas || !trigger) return;

    const settings = getPerfSettings();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, settings.dprCap);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let cleanupTimer = null;

    const fireLightning = () => {
      if (firedRef.current || reducedMotion) return;
      firedRef.current = true;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const segments = generateLightning(w, h, settings.branches);
      const duration = 800;
      const fadeDuration = 450;
      const startTime = performance.now();
      let raf;

      const animate = (now) => {
        const elapsed = now - startTime;
        const drawProgress = Math.min(elapsed / duration, 1);
        const fadeProgress =
          elapsed > duration ? Math.min((elapsed - duration) / fadeDuration, 1) : 0;

        ctx.clearRect(0, 0, w, h);

        if (fadeProgress >= 1) return;

        const alpha = 1 - fadeProgress;
        // Subtle flicker during draw phase
        const flicker = drawProgress < 1 ? 0.85 + Math.random() * 0.15 : 1;

        segments.forEach((seg) => {
          const drawCount = Math.max(2, Math.ceil(seg.points.length * drawProgress));
          if (drawCount < 2) return;

          // Outer glow pass
          if (settings.glow) {
            ctx.shadowBlur = settings.shadowBlur;
            ctx.shadowColor = "hsl(75 82% 60%)";
            ctx.strokeStyle = `hsla(75, 82%, 65%, ${alpha * 0.4 * flicker})`;
            ctx.lineWidth = seg.width + 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(seg.points[0].x, seg.points[0].y);
            for (let i = 1; i < drawCount; i++) {
              ctx.lineTo(seg.points[i].x, seg.points[i].y);
            }
            ctx.stroke();
          }

          // Bright core
          ctx.shadowBlur = settings.glow ? 4 : 0;
          ctx.strokeStyle = `hsla(75, 95%, 88%, ${alpha * flicker})`;
          ctx.lineWidth = seg.width;
          ctx.beginPath();
          ctx.moveTo(seg.points[0].x, seg.points[0].y);
          for (let i = 1; i < drawCount; i++) {
            ctx.lineTo(seg.points[i].x, seg.points[i].y);
          }
          ctx.stroke();
        });

        ctx.shadowBlur = 0;

        if (drawProgress < 1 || fadeProgress < 1) {
          raf = requestAnimationFrame(animate);
        }
      };
      raf = requestAnimationFrame(animate);
      cleanupTimer = setTimeout(() => cancelAnimationFrame(raf), duration + fadeDuration + 100);
    };

    // Fire when hero section scrolls out of view (user scrolls past landing)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          fireLightning();
        }
      },
      { threshold: 0 }
    );
    observer.observe(trigger);

    // Fallback: if already scrolled past on mount
    if (trigger.getBoundingClientRect().bottom < 0) {
      fireLightning();
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };
  }, [triggerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[55] pointer-events-none"
      aria-hidden="true"
    />
  );
}