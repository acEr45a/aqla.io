import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPerfSettings } from "@/utils/deviceBenchmark";

/* ── Easing functions for cinematic motion ── */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t) => t * t * t;

/* ── Controlled branch generation (no per-frame randomness) ── */
function generateBranches(somaX, somaY, w, h) {
  const branches = [];
  const numMain = 7;

  for (let b = 0; b < numMain; b++) {
    const t = b / (numMain - 1);
    const baseAngle = -Math.PI * 0.38 + t * Math.PI * 0.76;
    const length = (0.55 + Math.sin(t * Math.PI) * 0.3) * w;
    const numPoints = 32;
    const points = [{ x: somaX, y: somaY }];

    let x = somaX, y = somaY;
    for (let j = 1; j <= numPoints; j++) {
      const progress = j / numPoints;
      const curve = Math.sin(progress * Math.PI * 1.5 + b * 0.6) * 0.1;
      const angle = baseAngle + curve * progress;
      const stepLen = length / numPoints;
      x += Math.cos(angle) * stepLen;
      y += Math.sin(angle) * stepLen;
      points.push({ x, y });
    }

    branches.push({ points, width: 2.5, delay: 0 });

    // Two sub-branches per main branch
    for (let s = 0; s < 2; s++) {
      const splitRatio = 0.3 + s * 0.3;
      const splitIdx = Math.floor(points.length * splitRatio);
      const split = points[splitIdx];
      const subAngle = baseAngle + (s === 0 ? 0.55 : -0.55);
      const subLength = length * 0.2;
      const subPoints = [{ x: split.x, y: split.y }];

      let sx = split.x, sy = split.y;
      for (let j = 1; j <= 14; j++) {
        const progress = j / 14;
        const curve = Math.sin(progress * Math.PI * 1.3 + s) * 0.08;
        const angle = subAngle + curve * progress;
        const step = subLength / 14;
        sx += Math.cos(angle) * step;
        sy += Math.sin(angle) * step;
        subPoints.push({ x: sx, y: sy });
      }
      branches.push({ points: subPoints, width: 1.5, delay: splitRatio });
    }
  }

  return branches;
}

export default function SignalPath({ triggerRef }) {
  const canvasRef = useRef(null);
  const firedRef = useRef(false);
  const [active, setActive] = useState(false);

  /* ── Scroll lock: prevents wheel, touch, and keyboard scrolling ── */
  useEffect(() => {
    if (!active) return;
    const prevent = (e) => e.preventDefault();
    window.addEventListener("wheel", prevent, { passive: false });
    window.addEventListener("touchmove", prevent, { passive: false });
    window.addEventListener("keydown", prevent, { passive: false });
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("wheel", prevent);
      window.removeEventListener("touchmove", prevent);
      window.removeEventListener("keydown", prevent);
      document.body.style.overflow = "";
    };
  }, [active]);

  /* ── Observer + canvas animation ── */
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

    let timers = [];
    let raf = null;

    const fireNeuron = () => {
      if (firedRef.current || reducedMotion) return;
      firedRef.current = true;

      // Activate overlay → triggers scroll lock + dark screen fade-in
      setActive(true);

      const overlayFadeIn = 300;
      const somaDuration = 200;
      const growDuration = 800;
      const holdDuration = 200;
      const fadeDuration = 400;
      const totalAnim = somaDuration + growDuration + holdDuration + fadeDuration;

      // Start canvas animation after overlay is fully opaque
      const animTimer = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const somaX = w * 0.03;
        const somaY = h * 0.5;
        const branches = generateBranches(somaX, somaY, w, h);
        const startTime = performance.now();

        const animate = (now) => {
          const elapsed = now - startTime;
          if (elapsed > totalAnim) {
            ctx.clearRect(0, 0, w, h);
            return;
          }

          ctx.clearRect(0, 0, w, h);

          // Phase calculations
          const somaP = Math.min(elapsed / somaDuration, 1);
          const growP = elapsed > somaDuration
            ? Math.min((elapsed - somaDuration) / growDuration, 1)
            : 0;
          const fadeStart = somaDuration + growDuration + holdDuration;
          const fadeP = elapsed > fadeStart
            ? Math.min((elapsed - fadeStart) / fadeDuration, 1)
            : 0;

          // Eased values for cinematic smoothness
          const somaEased = easeOutCubic(somaP);
          const growEased = easeOutCubic(growP);
          const alpha = 1 - easeInCubic(fadeP);
          if (alpha <= 0) return;

          /* ── Soma (cell body ignition) ── */
          const somaRadius = 2 + somaEased * 7;
          const somaAlpha = Math.min(somaEased * 2, 1) * alpha;

          if (settings.glow) {
            ctx.shadowBlur = settings.shadowBlur;
            ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
          }

          // Expanding ignition ring
          if (somaP < 1) {
            const ringR = easeOutCubic(somaP) * 40;
            const ringA = (1 - somaP) * 0.4 * alpha;
            ctx.strokeStyle = `rgba(255, 255, 255, ${ringA})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(somaX, somaY, ringR, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Soma outer glow
          ctx.fillStyle = `rgba(255, 255, 255, ${somaAlpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(somaX, somaY, somaRadius + 5, 0, Math.PI * 2);
          ctx.fill();

          // Soma core
          ctx.fillStyle = `rgba(255, 255, 255, ${somaAlpha})`;
          ctx.beginPath();
          ctx.arc(somaX, somaY, somaRadius, 0, Math.PI * 2);
          ctx.fill();

          /* ── Branches (eased growth, no flicker) ── */
          branches.forEach((branch) => {
            const branchGrowth = branch.delay > 0
              ? Math.max(0, Math.min((growEased - branch.delay) / (1 - branch.delay), 1))
              : growEased;
            const drawCount = Math.max(2, Math.ceil(branch.points.length * branchGrowth));
            if (drawCount < 2) return;

            // Outer glow stroke
            if (settings.glow) {
              ctx.shadowBlur = settings.shadowBlur;
              ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
              ctx.lineWidth = branch.width + 3;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              ctx.beginPath();
              ctx.moveTo(branch.points[0].x, branch.points[0].y);
              for (let i = 1; i < drawCount; i++) {
                ctx.lineTo(branch.points[i].x, branch.points[i].y);
              }
              ctx.stroke();
            }

            // Bright white core
            ctx.shadowBlur = settings.glow ? 4 : 0;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = branch.width;
            ctx.beginPath();
            ctx.moveTo(branch.points[0].x, branch.points[0].y);
            for (let i = 1; i < drawCount; i++) {
              ctx.lineTo(branch.points[i].x, branch.points[i].y);
            }
            ctx.stroke();
          });

          ctx.shadowBlur = 0;
          raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
      }, overlayFadeIn);
      timers.push(animTimer);

      // Deactivate overlay after animation completes (triggers fade-out)
      const doneTimer = setTimeout(() => {
        setActive(false);
      }, overlayFadeIn + totalAnim + 100);
      timers.push(doneTimer);

      // Cancel raf after everything is done
      const cleanupTimer = setTimeout(() => {
        if (raf) cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }, overlayFadeIn + totalAnim + 200);
      timers.push(cleanupTimer);
    };

    // Trigger BEFORE "01" enters view (150px提前量)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fireNeuron();
      },
      { threshold: 0, rootMargin: "0px 0px 150px 0px" }
    );
    observer.observe(trigger);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
      timers.forEach((t) => clearTimeout(t));
    };
  }, [triggerRef]);

  return (
    <>
      {/* Cinematic dark overlay — covers all content, smooth fade in/out */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[54] bg-background pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>
      {/* Canvas — neuron signal on top of overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[55] pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}