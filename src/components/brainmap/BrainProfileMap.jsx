import React, { useState, useRef } from "react";
import { REGIONS, OUTLINES } from "./brainShapes";
import BrainRankTooltip from "./BrainRankTooltip";
import { rankFor } from "@/lib/ranks";

export default function BrainProfileMap({ domains = [], activeKey, onHover, onSelect }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const byKey = {};
  domains.forEach((d) => { byKey[d.key] = d; });

  const handlePointer = (event, key) => {
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({ key, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg viewBox="0 0 660 560" className="w-full h-full">
        <defs>
          <clipPath id="brain-body">
            {OUTLINES.map((d, i) => <path key={i} d={d} />)}
          </clipPath>
          <filter id="line-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* body outline */}
        <g fill="none" stroke="hsl(35 9% 58% / 0.55)" strokeWidth="1.6" strokeLinejoin="round" pointerEvents="none">
          {OUTLINES.map((d, i) => <path key={`o-${i}`} d={d} />)}
        </g>

        {/* region boundaries in rank colors */}
        <g fill="none" clipPath="url(#brain-body)" pointerEvents="none">
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            const rank = rankFor(domain.score);
            const active = activeKey === region.key;
            const dim = activeKey && !active;
            return (
              <path
                key={`r-${region.key}`}
                d={region.path}
                stroke={rank.color}
                strokeWidth={active ? 2.6 : 1.5}
                strokeLinejoin="round"
                filter={active ? "url(#line-glow)" : undefined}
                className="transition-opacity duration-300"
                opacity={dim ? 0.22 : active ? 1 : 0.7}
              />
            );
          })}
        </g>

        {/* faint tint on the active region only */}
        <g clipPath="url(#brain-body)" pointerEvents="none">
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain || activeKey !== region.key) return null;
            return <path key={`t-${region.key}`} d={region.path} fill={rankFor(domain.score).color} opacity="0.14" />;
          })}
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