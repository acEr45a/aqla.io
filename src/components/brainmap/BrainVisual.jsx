import React, { useState } from "react";
import { motion } from "framer-motion";
import { REGIONS, SILHOUETTE, SULCI } from "./brainShapes";

const GREY_FILL = "hsl(30 6% 24%)";
const GREY_STROKE = "hsl(30 8% 42%)";

// Simplified anatomical brain: every region is a gauge that fills bottom-up
// to its score — grey when empty, domain color when filled.
export default function BrainVisual({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const byKey = Object.fromEntries(domains.map((d) => [d.key, d]));
  const activeRegion = REGIONS.find((r) => r.key === (hover || selectedKey));
  const activeDomain = activeRegion && byKey[activeRegion.key];

  return (
    <div>
      <svg viewBox="0 0 660 560" className="w-full max-w-[560px] mx-auto block select-none">
        <defs>
          {REGIONS.map((r) => (
            <clipPath key={r.key} id={`brainclip-${r.key}`}><path d={r.path} /></clipPath>
          ))}
        </defs>

        <path d={SILHOUETTE} fill="hsl(30 6% 20%)" stroke={GREY_STROKE} strokeWidth="1.5" strokeLinejoin="round" />

        {REGIONS.map((r, i) => {
          const d = byKey[r.key];
          if (!d) return null;
          const [bx, by, bw, bh] = r.bbox;
          const fillH = (bh * d.score) / 100;
          const active = hover === r.key || selectedKey === r.key;
          return (
            <g key={r.key}
              onClick={() => onSelect && onSelect(d)}
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: onSelect ? "pointer" : "default" }}>
              <path d={r.path} fill={GREY_FILL} />
              <g clipPath={`url(#brainclip-${r.key})`}>
                <motion.rect x={bx - 6} width={bw + 12} fill={d.color}
                  initial={{ y: by + bh, height: 0 }}
                  animate={{ y: by + bh - fillH, height: fillH, opacity: active ? 1 : 0.85 }}
                  transition={{ duration: 1, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] }}
                />
              </g>
              <path d={r.path} fill="none"
                stroke={active ? d.color : GREY_STROKE}
                strokeWidth={active ? 2.5 : 1.5} strokeLinejoin="round" />
            </g>
          );
        })}

        <g pointerEvents="none">
          {SULCI.map((p, i) => (
            <path key={i} d={p} fill="none" stroke="hsl(26 14% 6%)" strokeOpacity="0.4"
              strokeWidth="2" strokeLinecap="round" />
          ))}
        </g>

        {REGIONS.map((r) => {
          const d = byKey[r.key];
          if (!d) return null;
          const [lx, ly] = r.label;
          const active = hover === r.key || selectedKey === r.key;
          const w = d.label.length * 7.6 + 52;
          return (
            <g key={`label-${r.key}`}
              onClick={() => onSelect && onSelect(d)}
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: onSelect ? "pointer" : "default" }}>
              {r.anchor && (
                <line x1={lx} y1={ly + (r.anchor[1] > ly ? 14 : -14)} x2={r.anchor[0]} y2={r.anchor[1]}
                  stroke={active ? d.color : GREY_STROKE} strokeWidth="1" />
              )}
              <rect x={lx - w / 2} y={ly - 14} width={w} height={28} rx={14}
                fill="hsl(26 14% 5% / 0.94)" stroke={active ? d.color : "hsl(30 7% 34%)"} strokeWidth={active ? 1.5 : 1} />
              <text x={lx - w / 2 + 13} y={ly + 4.5} fontSize="13" fontWeight="600"
                fill="hsl(40 24% 97%)" fontFamily="Inter, sans-serif">{d.label}</text>
              <text x={lx + w / 2 - 13} y={ly + 4.5} textAnchor="end" fontSize="13.5" fontWeight="700"
                fill={d.color} fontFamily="Space Grotesk, sans-serif" className="tabular-nums">{d.score}</text>
            </g>
          );
        })}
      </svg>

      <div className="h-9 flex items-center justify-center">
        {activeDomain ? (
          <p className="text-xs text-muted-foreground text-center">
            <span style={{ color: activeDomain.color }}>{activeRegion.region}</span>
            <span className="mx-2 text-border">·</span>
            {activeRegion.role}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center">Each region fills to its score — grey shows the headroom left.</p>
        )}
      </div>
    </div>
  );
}