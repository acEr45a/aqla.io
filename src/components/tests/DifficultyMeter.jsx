import React, { useEffect, useRef, useState } from "react";
import { Gauge } from "lucide-react";

// Reusable adaptive-difficulty indicator. Renders a segmented level scale
// and pulses briefly whenever the level changes, signalling a difficulty shift.
export default function DifficultyMeter({ level, total, label = "Difficulty" }) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(level);

  useEffect(() => {
    if (level === prev.current) return;
    setPulse(true);
    prev.current = level;
    const t = setTimeout(() => setPulse(false), 700);
    return () => clearTimeout(t);
  }, [level]);

  const safeLevel = Math.max(0, Math.min(level, total));

  return (
    <div className="flex flex-col items-center gap-2 select-none" aria-live="polite">
      <div className="flex items-center gap-1.5">
        <Gauge className="w-3 h-3 text-muted-foreground" strokeWidth={1.75} />
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span className={`text-[10px] tabular-nums transition-colors ${pulse ? "text-primary" : "text-muted-foreground"}`}>
          Lv {safeLevel}
        </span>
      </div>
      <div className={`flex items-end gap-1 transition-transform duration-300 ${pulse ? "scale-110" : "scale-100"}`}>
        {Array.from({ length: total }, (_, i) => {
          const active = i < safeLevel;
          const justActivated = pulse && i === safeLevel - 1;
          return (
            <span
              key={i}
              className={`w-2 rounded-full transition-all duration-300 ${
                active
                  ? justActivated
                    ? "h-4 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.75)]"
                    : "h-3 bg-primary/60"
                  : "h-2 bg-secondary/70"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}