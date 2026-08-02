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
const LABEL = "hsl(40 24% 96%)";

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
  const [ix, iy] = INSULA.label;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg viewBox="0 0 660 560" className="w-full h-full">
        {/* solid tiled fills — shared edges, no gaps, no transparency */}
        <g pointerEvents="none" strokeLinejoin="round">
          {FILL_REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            const rank = rankFor(domain.score);
            const active = activeKey === region.key;
            const dim = activeKey && !active;
            return (
              <path
                key={`f-${region.key}`}
                d={region.path}
                fill={rank.color}
                fillOpacity={dim ? 0.3 : 1}
                stroke={DIVIDER}
                strokeWidth={1.8}
                className="transition-opacity duration-300"
              />
            );
          })}
          {/* active region highlight outline */}
          {FILL_REGIONS.map((region) => {
            if (activeKey !== region.key) return null;
            const domain = byKey[region.key];
            if (!domain) return null;
            return (
              <path
                key={`a-${region.key}`}
                d={region.path}
                fill="none"
                stroke={rankFor(domain.score).color}
                strokeWidth={2.8}
              />
            );
          })}
        </g>

        {/* outer silhouette for cohesion */}
        <g fill="none" stroke={DIVIDER} strokeWidth={1.8} strokeLinejoin="round" pointerEvents="none">
          {OUTLINES.map((d, i) => <path key={`o-${i}`} d={d} />)}
        </g>

        {/* insula ring marker */}
        {insulaDomain && (
          <g pointerEvents="none" className="transition-opacity duration-300" opacity={activeKey && activeKey !== INSULA.key ? 0.4 : 1}>
            <circle cx={ix} cy={iy} r={10} fill={rankFor(insulaDomain.score).color} stroke={DIVIDER} strokeWidth={2.6} />
          </g>
        )}

        {/* labels — dark outline for legibility on any fill color */}
        <g
          pointerEvents="none"
          className="font-body"
          fontSize={15}
          fontWeight={500}
          fill={LABEL}
          stroke={DIVIDER}
          strokeWidth={3.5}
          strokeLinejoin="round"
          paintOrder="stroke"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {FILL_REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            return (
              <text key={`l-${region.key}`} x={region.label[0]} y={region.label[1]}>
                {SHORT[region.key]}
              </text>
            );
          })}
          {insulaDomain && <text x={ix} y={iy + 26}>Insula</text>}
        </g>

        {/* hit areas */}
        <g fill="transparent">
          {FILL_REGIONS.map((region) => {
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
          {insulaDomain && (
            <circle
              cx={ix}
              cy={iy}
              r={16}
              className="cursor-pointer"
              onPointerEnter={(e) => { onHover?.(INSULA.key); handlePointer(e, INSULA.key); }}
              onPointerMove={(e) => handlePointer(e, INSULA.key)}
              onPointerDown={(e) => { onHover?.(INSULA.key); handlePointer(e, INSULA.key); }}
              onPointerLeave={() => { onHover?.(null); setTooltip(null); }}
              onClick={() => onSelect?.(insulaDomain)}
            />
          )}
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