import React, { useEffect, useRef } from "react";
import { getPerfSettings } from "@/utils/deviceBenchmark";

/* ── Easing ── */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ── Unified timeline (ms) — every phase runs off ONE clock ── */
const T = {
  overlayIn: 400,   // dark screen fades in
  soma: 250,        // cell body ignites
  grow: 1100,       // branches sweep across the screen
  hold: 350,        // full neuron visible
  fadeOut: 500,     // neuron + overlay fade together
};
const TOTAL = T.overlayIn + T.soma + T.grow + T.hold + T.fadeOut;

/* ── Deterministic branch geometry, computed once per fire ── */
function generateBranches(somaX, somaY, w) {
  const branches = [];
  const numMain = 7;
  for (let b = 0; b < numMain; b++) {
    const t = b / (numMain - 1);
    const baseAngle = -Math.PI * 0.38 + t * Math.PI * 0.76;
    const length = (0.7 + Math.sin(t * Math.PI) * 0.35) * w;
    const numPoints = 32;
    const points = [{ x: somaX, y: somaY }];
    let x = somaX, y = somaY;
    for (let j = 1; j <= numPoints; j++) {
      const p = j / numPoints;
      const angle = baseAngle + Math.sin(p * Math.PI * 1.5 + b * 0.6) * 0.1 * p;
      x += (Math.cos(angle) * length) / numPoints;
      y += (Math.sin(angle) * length) / numPoints;
      points.push({ x, y });
    }
    branches.push({ points, width: 2.5, delay: 0 });

    for (let s = 0; s < 2; s++) {
      const splitRatio = 0.3 + s * 0.3;
      const split = points[Math.floor(points.length * splitRatio)];
      const subAngle = baseAngle + (s === 0 ? 0.55 : -0.55);
      const subLength = length * 0.2;
      const subPoints = [{ x: split.x, y: split.y }];
      let sx = split.x, sy = split.y;
      for (let j = 1; j <= 14; j++) {
        const p = j / 14;
        const angle = subAngle + Math.sin(p * Math.PI * 1.3 + s) * 0.08 * p;
        sx += (Math.cos(angle) * subLength) / 14;
        sy += (Math.sin(angle) * subLength) / 14;
        subPoints.push({ x: sx, y: sy });
      }
      branches.push({ points: subPoints, width: 1.5, delay: splitRatio });
    }
  }
  return branches;
}

/* Phase progress helper: 0→1 within [start, start+dur] of the clock */
const phase = (elapsed, start, dur) =>
  Math.max(0, Math.min((elapsed - start) / dur, 1));

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

    let raf = null;
    const preventTouch = (e) => e.preventDefault();

    const unlockScroll = () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("touchmove", preventTouch);
    };
    const lockScroll = () => {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      window.addEventListener("touchmove", preventTouch, { passive: false });
    };

    const fireNeuron = () => {
      if (firedRef.current || reducedMotion) return;
      firedRef.current = true;
      observer.disconnect(); // guaranteed single fire — no ghost re-triggers

      const w = window.innerWidth;
      const h = window.innerHeight;
      const somaX = w * 0.03;
      const somaY = h * 0.5;
      const branches = generateBranches(somaX, somaY, w); // geometry computed ONCE

      lockScroll();
      const startTime = performance.now();

      const animate = (now) => {
        const elapsed = now - startTime;

        if (elapsed >= TOTAL) {
          ctx.clearRect(0, 0, w, h);
          unlockScroll();
          return;
        }

        ctx.clearRect(0, 0, w, h);

        /* All phases derived from the SAME clock — perfectly synced */
        const overlayP = phase(elapsed, 0, T.overlayIn);
        const somaP = phase(elapsed, T.overlayIn, T.soma);
        const growP = phase(elapsed, T.overlayIn + T.soma, T.grow);
        const fadeP = phase(elapsed, T.overlayIn + T.soma + T.grow + T.hold, T.fadeOut);

        const fade = 1 - easeInOutCubic(fadeP);

        /* ── Dark overlay drawn on the canvas itself (zero sync lag) ── */
        const overlayAlpha = easeInOutCubic(overlayP) * fade;
        ctx.fillStyle = `rgba(13, 11, 9, ${overlayAlpha * 0.97})`;
        ctx.fillRect(0, 0, w, h);

        const somaEased = easeOutCubic(somaP);
        const growEased = easeOutCubic(growP);
        const alpha = Math.min(somaEased * 2, 1) * fade;

        if (alpha > 0.01) {
          if (settings.glow) {
            ctx.shadowBlur = settings.shadowBlur;
            ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
          }

          /* Ignition ring */
          if (somaP > 0 && somaP < 1) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - somaP) * 0.4 * fade})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(somaX, somaY, easeOutCubic(somaP) * 40, 0, Math.PI * 2);
            ctx.stroke();
          }

          /* Soma */
          const somaRadius = 2 + somaEased * 7;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(somaX, somaY, somaRadius + 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(somaX, somaY, somaRadius, 0, Math.PI * 2);
          ctx.fill();

          /* Branches */
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          branches.forEach((branch) => {
            const bg = branch.delay > 0
              ? Math.max(0, Math.min((growEased - branch.delay) / (1 - branch.delay), 1))
              : growEased;
            const drawCount = Math.ceil(branch.points.length * bg);
            if (drawCount < 2) return;

            const drawPath = () => {
              ctx.beginPath();
              ctx.moveTo(branch.points[0].x, branch.points[0].y);
              for (let i = 1; i < drawCount; i++) ctx.lineTo(branch.points[i].x, branch.points[i].y);
              ctx.stroke();
            };

            if (settings.glow) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${fade * 0.3})`;
              ctx.lineWidth = branch.width + 3;
              drawPath();
            }
            ctx.shadowBlur = settings.glow ? 4 : 0;
            ctx.strokeStyle = `rgba(255, 255, 255, ${fade})`;
            ctx.lineWidth = branch.width;
            drawPath();
            if (settings.glow) ctx.shadowBlur = settings.shadowBlur;
          });

          ctx.shadowBlur = 0;
        }

        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fireNeuron(); },
      { threshold: 0, rootMargin: "0px 0px 150px 0px" }
    );
    observer.observe(trigger);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
      unlockScroll();
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