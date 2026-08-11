import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";

// Standard multicolored confetti — explicitly not AQLA brand colors.
const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#f97316", "#a855f7", "#ec4899"];

export default function FirstCheckInWelcome({ open, firstName, onStart, onDismiss }) {
  useEffect(() => {
    if (!open) return;
    // Medium-density multicolored burst centered at the top of the viewport.
    confetti({
      particleCount: 180,
      spread: 100,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.15 },
      colors: COLORS,
    });
    // A softer second burst for a celebratory tail.
    const t = setTimeout(() => {
      confetti({ particleCount: 60, spread: 120, origin: { x: 0.5, y: 0.2 }, colors: COLORS, startVelocity: 35 });
    }, 350);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-background/95 px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onDismiss}
        >
          <motion.div
            className="aqla-panel w-full max-w-md rounded-3xl p-8 text-center"
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <span className="text-xl text-primary">✦</span>
            </div>
            <h2 className="font-display text-3xl text-foreground">You're all set, {firstName}.</h2>
            <p className="mt-3 text-sm text-muted-foreground">Your protocol is live. Let&rsquo;s log your first signals.</p>
            <Button onClick={onStart} className="mt-7 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              Start your first check-in
            </Button>
            <button onClick={onDismiss} className="mt-4 text-xs text-muted-foreground hover:text-foreground">
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}