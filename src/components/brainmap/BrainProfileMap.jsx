import React, { useState, useRef } from "react";
import { REGIONS, OUTLINES } from "./brainShapes";
import BrainRankTooltip from "./BrainRankTooltip";
import { rankFor } from "@/lib/ranks";

const SHORT = {
  focus: "Prefrontal",
  mental_energy: "Frontal",
  cognitive_resilience: "Parietal",
  learning_capacity: "Occipital",
  sleep_recovery: "Brainstem",
  lifestyle_protection: "Cerebellum",
  memory: "Temporal",
  stress_regulation: "Insula",
};

const DIVIDER = "hsl(26 14% 6%)";
const LABEL = "hsl(40 24% 93%)";

// Insula is rendered as a small ring marker, not an overlapping fill.
const FILL_REGIONS = REGIONS.filter((r) => r.key !== "stress_regulation");
const INSULA = REGIONS.find((r) => r.key === "stress_regulation");

export default function BrainProfileMap({ domains = [], activeKey, onHover, onSelect }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const byKey = {};
  domains.forEach((d) => { byKey[d.key] = d; });

  const handlePointer = (event, key) => {
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({ key, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const insulaDomain = byKey[INSULA.key];
  const insulaCenter = INSULA ? [INSULA.bbox[0] + INSULA.bbox[2] / 2, INSULA.bbox[1] + INSULA.bbox[3] / 2] : [0, 0];

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg viewBox="0 0 660 560" className="w-full h-full">
        <defs>
          <clipPath id="brain-body">
            {OUTLINES.map((d, i) => <path key={i} d={d} />)}
          </clipPath>
          {/* per-region masks: own path (white) minus later fill-regions (black) → true partition, no overlap */}
          {FILL_REGIONS.map((region, i) => (
            <mask id={`m-${region.key}`} key={`m-${region.key}`} maskUnits="userSpaceOnUse" x="0" y="0" width="660" height="560">
              <rect x="0" y="0" width="660" height="560" fill="black" />
              <path d={region.path} fill="white" />
              {FILL_REGIONS.slice(i + 1).map((r2, j) => (
                <path key={j} d={r2.path} fill="black" />
              ))}
            </mask>
          ))}
        </defs>

        {/* solid tiled fills — flat, no transparency, no overlap */}
        <g clipPath="url(#brain-body)" pointerEvents="none">
          {FILL_REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            const rank = rankFor(domain.score);
            const active = activeKey === region.key;
            const dim = activeKey && !active;
            return (
              <rect
                key={`f-${region.key}`}
                x="0" y="0" width="660" height="560"
                fill={rank.color}
                mask={`url(#m-${region.key})`}
                className="transition-opacity duration-300"
                opacity={dim ? 0.28 : 1}
              />
            );
          })}
        </g>

        {/* thin dark dividers between tiles */}
        <g fill="none" clipPath="url(#brain-body)" stroke={DIVIDER} strokeWidth="1.6" strokeLinejoin="round" pointerEvents="none">
          {FILL_REGIONS.map((region) => (
            <path key={`d-${region.key}`} d={region.path} />
          ))}
        </g>

        {/* active region highlight */}
        <g fill="none" clipPath="url(#brain-body)" pointerEvents="none">
          {FILL_REGIONS.map((region) => {
            if (activeKey !== region.key) return null;
            const domain = byKey[region.key];
            if (!domain) return null;
            return (
              <path key={`a-${region.key}`} d={region.path} stroke={rankFor(domain.score).color} strokeWidth="2.8" strokeLinejoin="round" />
            );
          })}
        </g>

        {/* insula ring marker */}
        {insulaDomain && (
          <g pointerEvents="none" className="transition-opacity duration-300" opacity={activeKey && activeKey !== INSULA.key ? 0.35 : 1}>
            <circle cx={insulaCenter[0]} cy={insulaCenter[1]} r="9" fill={rankFor(insulaDomain.score).color} stroke={DIVIDER} strokeWidth="2.5" />
          </g>
        )}

        {/* region labels */}
        <g pointerEvents="none" className="font-body" fontSize="13" fill={LABEL} textAnchor="middle" dominantBaseline="central">
          {FILL_REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            return (
              <text key={`l-${region.key}`} x={region.bbox[0] + region.bbox[2] / 2} y={region.bbox[1] + region.bbox[3] / 2}>
                {SHORT[region.key]}
              </text>
            );
          })}
          {insulaDomain && (
            <text x={insulaCenter[0]} y={insulaCenter[1] + 22}>Insula</text>
          )}
        </g>

        {/* hit areas */}
        <g fill="transparent">
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            return (
              <path
                key={`h-${region.key}`}
                d={region.path}
                className="cursor-pointer"
                onPointerEnter={(e) => { onHover?.(region.key); handlePointer(e, region.key); }}
                onPointerMove={(e) => handlePointer(e, region.key)}
                onPointerDown={(e) => { onHover?.(region.key); handlePointer(e, region.key); }}
                onPointerLeave={() => { onHover?.(null); setTooltip(null); }}
                onClick={() => onSelect?.(domain)}
              />
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <BrainRankTooltip
          domain={byKey[tooltip.key]}
          region={REGIONS.find((item) => item.key === tooltip.key)}
          x={tooltip.x}
          y={tooltip.y}
          container={containerRef.current}
        />
      )}
    </div>
  );
}