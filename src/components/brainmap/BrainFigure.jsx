import React, { useState } from "react";
import { motion } from "framer-motion";
import { REGIONS, OUTLINES } from "./brainRegions";

export default function BrainFigure({ domains = [], onSelect, selectedKey }) {
  const [hover, setHover] = useState(null);
  const byKey = Object.fromEntries(domains.map((d) => [d.key, d]));

  return (
    <svg viewBox="0 0 520 430" className="w-full h-auto select-none" role="img" aria-label="Brain Health Map">
      <defs>
        <clipPath id="brain-clip">
          {OUTLINES.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
        {REGIONS.map((r) => (
          <clipPath key={r.key} id={`region-${r.key}`}><path d={r.d} /></clipPath>
        ))}
      </defs>

      {/* base silhouette */}
      {OUTLINES.map((d, i) => (
        <path key={i} d={d} fill="hsl(26 11% 10%)" stroke="hsl(30 9% 20%)" strokeWidth="1.5" />
      ))}

      <g clipPath="url(#brain-clip)">
        {REGIONS.map((r) => {
          const dom = byKey[r.key];
          if (!dom) return null;
          const active = hover === r.key || selectedKey === r.key;
          const fillH = (dom.score / 100) * (r.yMax - r.yMin);
          return (
            <g key={r.key} clipPath={`url(#region-${r.key})`}
              onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)}
              onClick={() => onSelect && onSelect(dom)} style={{ cursor: onSelect ? "pointer" : "default" }}>
              {/* region base tint + hit area */}
              <path d={r.d} fill={dom.color} fillOpacity={active ? 0.14 : 0.06} style={{ transition: "fill-opacity 0.3s" }} />
              {/* liquid fill rises to the score */}
              <motion.rect
                x={r.xMin} width={r.xMax - r.xMin}
                initial={{ y: r.yMax, height: 0 }}
                animate={{ y: r.yMax - fillH, height: fillH }}
                transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                fill={dom.color} fillOpacity={active ? 0.75 : 0.45}
                style={{ transition: "fill-opacity 0.3s" }}
              />
              {/* fill surface line */}
              <motion.rect
                x={r.xMin} width={r.xMax - r.xMin} height={1.5}
                initial={{ y: r.yMax }} animate={{ y: r.yMax - fillH }}
                transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                fill={dom.color} fillOpacity={0.95}
              />
            </g>
          );
        })}
        {/* interior dividers for an organic look */}
        {REGIONS.map((r) => (
          <path key={`div-${r.key}`} d={r.d} fill="none" stroke="hsl(26 14% 6%)" strokeWidth="3" pointerEvents="none" />
        ))}
      </g>

      {/* outline on top */}
      {OUTLINES.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="hsl(30 12% 26%)" strokeWidth="1.5" pointerEvents="none" />
      ))}

      {/* labels with leader lines */}
      {REGIONS.map((r) => {
        const dom = byKey[r.key];
        if (!dom) return null;
        const active = hover === r.key || selectedKey === r.key;
        return (
          <g key={`lbl-${r.key}`} onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)}
            onClick={() => onSelect && onSelect(dom)} style={{ cursor: onSelect ? "pointer" : "default" }}>
            <line x1={r.ax} y1={r.ay} x2={r.lx} y2={r.ly} stroke={dom.color} strokeOpacity={active ? 0.7 : 0.3} strokeWidth="1" />
            <circle cx={r.ax} cy={r.ay} r="2.5" fill={dom.color} fillOpacity={active ? 1 : 0.6} />
            <text x={r.lx + (r.anchor === "end" ? -4 : 4)} y={r.ly - 2} textAnchor={r.anchor}
              fill={active ? "hsl(40 24% 93%)" : "hsl(35 9% 58%)"} fontSize="12.5" fontFamily="Space Grotesk"
              style={{ transition: "fill 0.3s" }}>
              {dom.label}
            </text>
            <text x={r.lx + (r.anchor === "end" ? -4 : 4)} y={r.ly + 12} textAnchor={r.anchor}
              fill={dom.color} fontSize="13" fontFamily="Space Grotesk" fontWeight="600" className="tabular-nums">
              {dom.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}