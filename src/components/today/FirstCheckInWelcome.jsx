import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function FirstCheckInWelcome({ open, firstName, onBegin, onDismiss }) {
  useEffect(() => {
    if (!open) return;
    const colors = ["#ef4444", "#3b82f6", "#22c55e", "#facc15", "#f97316", "#a855f7", "#ec4899"];
    const burst = (originX, angle) =>
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { x: originX, y: 0.18 },
        angle,
        colors,
        scalar: 0.95,
        ticks: 220,
        gravity: 1,
        disableForReducedMotion: true,
      });
    burst(0.25, 60);
    burst(0.75, 120);
    const t = setTimeout(() => burst(0.5, 90), 180);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onDismiss} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="aqla-panel rounded-3xl p-8 text-center">
          <p className="text-[11px] uppercase tracking-widest text-primary">Welcome to AQLA</p>
          <h2 className="mt-3 font-display text-3xl text-foreground">
            You're all set, {firstName}.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Your protocol is live. Let's log your first signals.
          </p>
          <button
            onClick={onBegin}
            className="mt-7 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start your first check-in
          </button>
          <button
            onClick={onDismiss}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground"
          >
            I'll do it later
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}