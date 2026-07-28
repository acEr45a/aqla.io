import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REGIONS, BRAIN_IMAGE } from "./brainRegions";
import { rankFor } from "@/lib/ranks";
import RankCard from "./RankCard";
import RankLegend from "./RankLegend";

const clampPct = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Glass brain: every region is filled with its rank colour, breathing softly,
// with an anchored rank callout on the active region.
export default function BrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const byKey = Object.fromEntries(domains.map((d) => [d.key, d]));
  const activeKey = hover || selectedKey;
  const activeRegion = REGIONS.find((r) => r.key === activeKey);
  const activeDomain = activeRegion && byKey[activeRegion.key];

  return (
    <div>
      <div className="relative w-full max-w-[540px] mx-auto aspect-square select-none">
        {REGIONS.map((r, i) => {
          const d = byKey[r.key];
          if (!d) return null;
          const rank = rankFor(d.score);
          const active = activeKey === r.key;
          const intensity = 0.45 + (d.score / 100) * 0.5;
          const size = r.size * (0.82 + (d.score / 100) * 0.3);
          return (
            <motion.button key={r.key} type="button" aria-label={`${d.label} — ${rank.name}`}
              onClick={() => onSelect && onSelect(d)}
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{
                opacity: active ? [intensity, 1, intensity] : [intensity * 0.85, intensity, intensity * 0.85],
                scale: active ? 1.12 : 1,
              }}
              transition={{
                opacity: { duration: active ? 1.8 : 3.6 + i * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 },
                scale: { type: "spring", stiffness: 260, damping: 22 },
              }}
              className="absolute rounded-full"
              style={{
                left: `${r.x}%`, top: `${r.y}%`, width: `${size}%`,
                aspectRatio: "1 / 0.85",
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle at 50% 45%, ${rank.color} 0%, ${rank.color}d9 38%, ${rank.color}59 64%, transparent 78%)`,
                filter: `blur(${active ? 5 : 8}px)`,
                cursor: onSelect ? "pointer" : "default",
              }}
            />
          );
        })}

        {/* ignition ripple on the active region */}
        <AnimatePresence>
          {activeRegion && activeDomain && (
            <motion.span key={activeRegion.key} initial={{ opacity: 0.7, scale: 0.4 }} animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${activeRegion.x}%`, top: `${activeRegion.y}%`,
                width: `${activeRegion.size * 1.4}%`, aspectRatio: "1 / 0.85",
                transform: "translate(-50%, -50%)",
                border: `1px solid ${rankFor(activeDomain.score).color}`,
              }} />
          )}
        </AnimatePresence>

        <img src={BRAIN_IMAGE} alt="Translucent glass brain" draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-90" />

        {/* region pills */}
        {REGIONS.map((r) => {
          const d = byKey[r.key];
          if (!d) return null;
          const rank = rankFor(d.score);
          const active = activeKey === r.key;
          if (active) return null;
          return (
            <motion.div key={`p-${r.key}`}
              onClick={() => onSelect && onSelect(d)}
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="absolute flex flex-col items-center text-center leading-tight"
              style={{
                left: `${r.x}%`, top: `${r.y}%`, width: "30%",
                transform: "translate(-50%, -50%)",
                textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                cursor: onSelect ? "pointer" : "default",
              }}>
              <span className="text-[10px] md:text-[11px] text-white/85 whitespace-nowrap">{d.label}</span>
              <span className="font-display text-lg md:text-xl font-bold text-white tabular-nums leading-none">{d.score}</span>
              <span className="mt-0.5 text-[9px] md:text-[10px] tracking-wider uppercase whitespace-nowrap" style={{ color: rank.color }}>{rank.name}</span>
            </motion.div>
          );
        })}

        {/* anchored rank callout */}
        <AnimatePresence mode="wait">
          {activeDomain && (
            <motion.div key={`c-${activeRegion.key}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute z-10"
              style={{
                left: `${clampPct(activeRegion.x, 20, 80)}%`,
                top: `${clampPct(activeRegion.y, 16, 88)}%`,
                transform: "translate(-50%, -50%)",
              }}>
              <RankCard domain={activeDomain} region={activeRegion} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-9 flex items-center justify-center px-4">
        {activeDomain ? (
          <p className="text-xs text-muted-foreground text-center">
            <span style={{ color: rankFor(activeDomain.score).color }}>{activeRegion.region}</span>
            <span className="mx-2 text-border">·</span>
            {activeRegion.role}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center">Each region carries its own rank — hover a region to see how close it is to the next one.</p>
        )}
      </div>

      <RankLegend />
    </div>
  );
}