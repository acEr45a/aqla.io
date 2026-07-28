import React, { useState } from "react";
import { motion } from "framer-motion";
import { REGIONS, BRAIN_IMAGE } from "./brainRegions";

// Glass cross-section brain: score-driven volumes glow inside a translucent brain.
export default function BrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const byKey = Object.fromEntries(domains.map((d) => [d.key, d]));
  const activeRegion = REGIONS.find((r) => r.key === (hover || selectedKey));
  const activeDomain = activeRegion && byKey[activeRegion.key];

  return (
    <div>
      <div className="relative w-full max-w-[540px] mx-auto aspect-square select-none">
        {REGIONS.map((r, i) => {
          const d = byKey[r.key];
          if (!d) return null;
          const active = hover === r.key || selectedKey === r.key;
          const intensity = 0.5 + (d.score / 100) * 0.5;
          const size = r.size * (0.8 + (d.score / 100) * 0.35);
          return (
            <motion.button key={r.key} type="button" aria-label={d.label}
              onClick={() => onSelect && onSelect(d)}
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: active ? 1.08 : 1 }}
              transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
              className="absolute rounded-full"
              style={{
                left: `${r.x}%`, top: `${r.y}%`, width: `${size}%`,
                aspectRatio: "1 / 0.85",
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle at 50% 45%, ${d.color} 0%, ${d.color}d9 40%, ${d.color}4d 65%, transparent 78%)`,
                opacity: intensity,
                filter: `blur(${active ? 5 : 8}px)`,
                cursor: onSelect ? "pointer" : "default",
              }}
            />
          );
        })}

        <img src={BRAIN_IMAGE} alt="Translucent glass brain" draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-90" />

        {REGIONS.map((r) => {
          const d = byKey[r.key];
          if (!d) return null;
          const active = hover === r.key || selectedKey === r.key;
          return (
            <div key={`t-${r.key}`}
              onClick={() => onSelect && onSelect(d)}
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
              className="absolute flex flex-col items-center text-center leading-tight"
              style={{
                left: `${r.x}%`, top: `${r.y}%`, width: "17%",
                transform: "translate(-50%, -50%)",
                textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                cursor: onSelect ? "pointer" : "default",
              }}>
              <span className={`text-[10px] md:text-[11px] font-body ${active ? "text-white" : "text-white/80"}`}>
                {d.label}
              </span>
              <span className="font-display text-xl md:text-2xl font-bold text-white tabular-nums">
                {d.score}
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-9 flex items-center justify-center">
        {activeDomain ? (
          <p className="text-xs text-muted-foreground text-center">
            <span style={{ color: activeDomain.color }}>{activeRegion.region}</span>
            <span className="mx-2 text-border">·</span>
            {activeRegion.role}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center">Each region glows to its score — brighter means stronger.</p>
        )}
      </div>
    </div>
  );
}