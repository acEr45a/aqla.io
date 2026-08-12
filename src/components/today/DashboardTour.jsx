import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { TOUR_STEPS } from "@/lib/tourSteps";

const PAD = 8;

export default function DashboardTour({ open, onClose, onFinished }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);

  const step = TOUR_STEPS[index];

  useEffect(() => {
    if (!open || !step) return;
    const measure = () => {
      const el = step.selector ? document.querySelector(step.selector) : null;
      if (!el) return setRect(null);
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(() => setRect(el.getBoundingClientRect()), 320);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, index, step]);

  if (!open || !step) return null;

  const finish = async () => {
    onClose();
    await base44.auth.updateMe({ dashboard_tour_v2: true }).catch(() => {});
    if (onFinished) onFinished();
  };
  const next = () => (index === TOUR_STEPS.length - 1 ? finish() : setIndex(index + 1));

  const cardStyle = rect
    ? rect.top > window.innerHeight / 2
      ? { bottom: window.innerHeight - rect.top + 14, left: 16, right: 16 }
      : { top: rect.bottom + 14, left: 16, right: 16 }
    : { top: "50%", left: 16, right: 16, transform: "translateY(-50%)" };

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {rect && (
        <>
          <div className="absolute bg-background/85 backdrop-blur-[2px]" onClick={finish}
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD) }} />
          <div className="absolute bg-background/85 backdrop-blur-[2px]" onClick={finish}
            style={{ top: rect.bottom + PAD, left: 0, right: 0, bottom: 0 }} />
          <div className="absolute bg-background/85 backdrop-blur-[2px]" onClick={finish}
            style={{ top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 }} />
          <div className="absolute bg-background/85 backdrop-blur-[2px]" onClick={finish}
            style={{ top: rect.top - PAD, left: rect.right + PAD, right: 0, height: rect.height + PAD * 2 }} />
          <div
            className="absolute rounded-2xl border-2 border-primary/70 pointer-events-none transition-all duration-300"
            style={{
              top: rect.top - PAD, left: rect.left - PAD,
              width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            }}
          />
        </>
      )}
      <div className="absolute mx-auto max-w-md" style={cardStyle}>
        <div className="aqla-panel rounded-2xl p-5 shadow-2xl">
          <p className="text-[11px] uppercase tracking-widest text-primary">
            Step {index + 1} of {TOUR_STEPS.length}
          </p>
          <h3 className="mt-2 font-display text-xl text-foreground">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <button onClick={finish} className="text-xs text-muted-foreground hover:text-foreground">Skip tour</button>
            <div className="flex gap-2">
              {index > 0 && <Button variant="outline" size="sm" onClick={() => setIndex(index - 1)}>Back</Button>}
              <Button size="sm" onClick={next}>{index === TOUR_STEPS.length - 1 ? "Finish" : "Next"}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}