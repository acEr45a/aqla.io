import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REGIONS, BRAIN_IMAGE } from "./brainRegions";
import { rankFor } from "@/lib/ranks";
import RankCard from "./RankCard";
import RankLegend from "./RankLegend";

const clampPct = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Glass brain: every region is filled with its rank colour, breathing softly,
// with an anchored rank callout on the active region.
export default function BrainVisual({ domains = [], onSelect, selectedKey, showRankNames = false }) {
  const [hover, setHover] = useState(null);
  const byKey = Object.fromEntries(domains.map((d) => [d.key, d]));
  const activeKey = hover || selectedKey;
  const activeRegion = REGIONS.find((r) => r.key === activeKey);
  const activeDomain = activeRegion && byKey[activeRegion.key];

  return (
    <div>
      <div className="relative w-full max-w-[540px] mx-auto aspect-square select-none">
        <div className="absolute inset-0" style={{
          zIndex: 3,
          WebkitMaskImage: `url(${BRAIN_IMAGE})`, maskImage: `url(${BRAIN_IMAGE})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          maskMode: "luminance", WebkitMaskSourceType: "luminance",
        }}>
        {REGIONS.map((r, i) => {
          const d = byKey[r.key];
          if (!d) return null;
          const rank = rankFor(d.score);
          const active = activeKey === r.key;
          const intensity = 0.6 + (d.score / 100) * 0.3;
          const period = active ? 2.2 : 4.6 + i * 0.35;
          return (
            <div key={r.key} className="absolute"
              style={{
                left: `${r.x}%`, top: `${r.y}%`, width: `${r.size}%`,
                aspectRatio: "1 / 0.88",
                transform: "translate(-50%, -50%)",
              }}>
              <motion.button type="button" aria-label={`${d.label} — ${rank.name}`}
                onClick={() => onSelect && onSelect(d)}
                onMouseEnter={() => setHover(r.key)}
                onMouseLeave={() => setHover(null)}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: active ? [intensity, 1, intensity] : [intensity * 0.8, intensity, intensity * 0.8],
                  scale: active ? [1.06, 1.16, 1.06] : [0.97, 1.04, 0.97],
                }}
                transition={{
                  opacity: { duration: period, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                  scale: { duration: period, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 50% 45%, ${rank.color} 0%, ${rank.color}e6 52%, ${rank.color}99 72%, ${rank.color}40 86%, transparent 97%)`,
                  filter: `blur(${active ? 14 : 16}px) saturate(1.5)`,
                  cursor: onSelect ? "pointer" : "default",
                }}
              />
            </div>
          );
        })}
        </div>

        {/* ignition ripple on the active region */}
        <AnimatePresence>
          {activeRegion && activeDomain && (
            <div key={activeRegion.key} className="absolute pointer-events-none"
              style={{
                left: `${activeRegion.x}%`, top: `${activeRegion.y}%`,
                width: `${activeRegion.size * 1.35}%`, aspectRatio: "1 / 0.88",
                transform: "translate(-50%, -50%)",
              }}>
              <motion.span initial={{ opacity: 0.55, scale: 0.5 }} animate={{ opacity: 0, scale: 1.35 }}
                exit={{ opacity: 0 }} transition={{ duration: 1.3, ease: "easeOut" }}
                className="absolute inset-0 rounded-full"
                style={{ border: `1px solid ${rankFor(activeDomain.score).color}80` }} />
            </div>
          )}
        </AnimatePresence>

        <img src={BRAIN_IMAGE} alt="Translucent glass brain" draggable={false}
          style={{ zIndex: 2 }}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-90" />

        {/* region pills */}
        {REGIONS.map((r) => {
          const d = byKey[r.key];
          if (!d) return null;
          const rank = rankFor(d.score);
          const active = activeKey === r.key;
          if (active) return null;
          return (
            <div key={`p-${r.key}`}
              onClick={() => onSelect && onSelect(d)}
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
              className="absolute flex flex-col items-center text-center leading-tight"
              style={{
                left: `${r.x - 11}%`, top: `${r.y}%`, width: "30%",
                transform: "translate(-50%, -50%)",
                zIndex: 5,
                textShadow:
                  "-1px -1px 0 rgba(0,0,0,0.9), 1px -1px 0 rgba(0,0,0,0.9), -1px 1px 0 rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,1), 0 0 18px rgba(0,0,0,0.95)",
                cursor: onSelect ? "pointer" : "default",
              }}>
              <span className="font-display text-[10px] md:text-[11px] font-medium tracking-tight text-white whitespace-nowrap">{d.label}</span>
              <span className="font-display text-lg md:text-xl font-bold tracking-tight text-white tabular-nums leading-none">{d.score}</span>
              {showRankNames && (
                <span className="mt-0.5 text-[10px] font-semibold whitespace-nowrap" style={{ color: rank.color }}>
                  {rank.name}
                </span>
              )}
              {!showRankNames && (
                <span className="mt-1 w-6 h-[2px] rounded-full" style={{ background: rank.color, boxShadow: `0 0 6px ${rank.color}` }} />
              )}
            </div>
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