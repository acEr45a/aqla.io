import React, { useEffect, useRef } from "react";
import { getPerfSettings } from "@/utils/deviceBenchmark";

// Generate organic dendritic branches emanating from a neuron soma.
// Branches curve organically (not jagged like lightning) and spread outward.
function generateNeuronSignal(somaX, somaY, width, height, numSubBranches) {
  const segments = [];

  // Main branches — radiate from soma, biased towards right (content area)
  const numMain = 6 + Math.floor(Math.random() * 3);

  for (let b = 0; b < numMain; b++) {
    const t = numMain > 1 ? b / (numMain - 1) : 0.5;
    // Spread from -100° to +100° from right direction
    const baseAngle = -Math.PI * 0.55 + t * Math.PI * 1.1 + (Math.random() - 0.5) * 0.25;

    const branchLength = (0.25 + Math.random() * 0.45) * width;
    const numJoints = 10 + Math.floor(Math.random() * 8);
    const stepLen = branchLength / numJoints;
    const points = [{ x: somaX, y: somaY }];

    let cx = somaX, cy = somaY;
    let currentAngle = baseAngle;

    for (let j = 0; j < numJoints; j++) {
      currentAngle += (Math.random() - 0.5) * 0.32;
      cx += Math.cos(currentAngle) * stepLen;
      cy += Math.sin(currentAngle) * stepLen;
      cx = Math.max(-30, Math.min(width + 30, cx));
      cy = Math.max(-30, Math.min(height + 30, cy));
      points.push({ x: cx, y: cy });
    }

    segments.push({ points, width: 2 });

    // Sub-branches — smaller offshoots
    if (numSubBranches > 0) {
      const numSub = 1 + Math.floor(Math.random() * (numSubBranches / 2));
      for (let s = 0; s < numSub; s++) {
        const splitIdx = Math.floor(Math.random() * (points.length - 3)) + 2;
        const split = points[splitIdx];
        const subAngle = currentAngle + (Math.random() - 0.5) * 1.4;
        const subLen = branchLength * (0.25 + Math.random() * 0.3);
        const subJoints = 5 + Math.floor(Math.random() * 4);
        const subStep = subLen / subJoints;
        const subPts = [{ x: split.x, y: split.y }];

        let sx = split.x, sy = split.y;
        let subAng = subAngle;
        for (let j = 0; j < subJoints; j++) {
          subAng += (Math.random() - 0.5) * 0.45;
          sx += Math.cos(subAng) * subStep;
          sy += Math.sin(subAng) * subStep;
          subPts.push({ x: sx, y: sy });
        }
        segments.push({ points: subPts, width: 1 });
      }
    }
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

    const fireNeuron = () => {
      if (firedRef.current || reducedMotion) return;
      firedRef.current = true;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const somaX = w * 0.06;
      const somaY = h * 0.5;
      const segments = generateNeuronSignal(somaX, somaY, w, h, settings.branches);

      const somaDuration = 200;   // soma ignition phase
      const growDuration = 700;    // branch propagation phase
      const fadeDuration = 500;    // fade out phase
      const totalDuration = somaDuration + growDuration + fadeDuration;
      const startTime = performance.now();
      let raf;

      const animate = (now) => {
        const elapsed = now - startTime;
        if (elapsed > totalDuration) return;

        ctx.clearRect(0, 0, w, h);

        // Determine phases
        const somaProgress = Math.min(elapsed / somaDuration, 1);
        const growProgress =
          elapsed > somaDuration
            ? Math.min((elapsed - somaDuration) / growDuration, 1)
            : 0;
        const fadeProgress =
          elapsed > somaDuration + growDuration
            ? Math.min((elapsed - somaDuration - growDuration) / fadeDuration, 1)
            : 0;

        const alpha = 1 - fadeProgress;
        if (alpha <= 0) return;

        // --- Draw soma (cell body) ---
        const somaRadius = 3 + somaProgress * 6;
        const somaAlpha = Math.min(somaProgress * 2, 1) * alpha;

        if (settings.glow) {
          ctx.shadowBlur = settings.shadowBlur;
          ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
        }

        // Pulse ring — expanding from soma on ignition
        if (somaProgress < 1) {
          const ringR = somaProgress * 35;
          const ringA = (1 - somaProgress) * 0.4 * alpha;
          ctx.strokeStyle = `rgba(255, 255, 255, ${ringA})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(somaX, somaY, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Soma glow
        ctx.fillStyle = `rgba(255, 255, 255, ${somaAlpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(somaX, somaY, somaRadius + 4, 0, Math.PI * 2);
        ctx.fill();

        // Soma core
        ctx.fillStyle = `rgba(255, 255, 255, ${somaAlpha})`;
        ctx.beginPath();
        ctx.arc(somaX, somaY, somaRadius, 0, Math.PI * 2);
        ctx.fill();

        // --- Draw branches ---
        const flicker = growProgress < 1 ? 0.88 + Math.random() * 0.12 : 1;

        segments.forEach((seg) => {
          const drawCount = Math.max(2, Math.ceil(seg.points.length * growProgress));
          if (drawCount < 2) return;

          // Outer glow
          if (settings.glow) {
            ctx.shadowBlur = settings.shadowBlur;
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.35 * flicker})`;
            ctx.lineWidth = seg.width + 2.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(seg.points[0].x, seg.points[0].y);
            for (let i = 1; i < drawCount; i++) {
              ctx.lineTo(seg.points[i].x, seg.points[i].y);
            }
            ctx.stroke();
          }

          // Bright white core
          ctx.shadowBlur = settings.glow ? 3 : 0;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * flicker})`;
          ctx.lineWidth = seg.width;
          ctx.beginPath();
          ctx.moveTo(seg.points[0].x, seg.points[0].y);
          for (let i = 1; i < drawCount; i++) {
            ctx.lineTo(seg.points[i].x, seg.points[i].y);
          }
          ctx.stroke();
        });

        ctx.shadowBlur = 0;

        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
      cleanupTimer = setTimeout(() => cancelAnimationFrame(raf), totalDuration + 100);
    };

    // Fire when the trigger element enters view (e.g. the "01" step card)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fireNeuron();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(trigger);

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