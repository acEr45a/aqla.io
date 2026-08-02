import React, { useState, useRef } from "react";
import { REGIONS } from "./brainShapes";
import BrainRankTooltip from "./BrainRankTooltip";
import { rankFor } from "@/lib/ranks";

const BRAIN_IMAGE = "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/28db4ba02_generated_image.png";

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
          <filter id="outline-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* luminance mask from the brain image — strokes stay on the brain */}
          <mask id="brain-lum" maskUnits="userSpaceOnUse" x="0" y="0" width="660" height="560">
            <image href={BRAIN_IMAGE} x="30" y="10" width="600" height="540" preserveAspectRatio="xMidYMid meet" />
          </mask>
        </defs>

        {/* solid photoreal glass brain */}
        <image
          href={BRAIN_IMAGE}
          x="30" y="10" width="600" height="540"
          preserveAspectRatio="xMidYMid meet"
          pointerEvents="none"
        />

        {/* region outlines in their rank color */}
        <g fill="none" mask="url(#brain-lum)" pointerEvents="none">
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            const rank = rankFor(domain.score);
            const active = activeKey === region.key;
            const dim = activeKey && !active;
            return (
              <g key={`outline-${region.key}`} className="transition-opacity duration-300" opacity={dim ? 0.35 : 1}>
                <path
                  d={region.path}
                  stroke="rgba(10,12,10,0.65)"
                  strokeWidth={active ? 9 : 7}
                  strokeLinejoin="round"
                />
                <path
                  d={region.path}
                  stroke={rank.color}
                  strokeWidth={active ? 4.5 : 3}
                  strokeLinejoin="round"
                  filter="url(#outline-glow)"
                />
              </g>
            );
          })}
        </g>

        {/* soft interior wash only on the active region */}
        <g mask="url(#brain-lum)" pointerEvents="none" style={{ mixBlendMode: "screen" }}>
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain || activeKey !== region.key) return null;
            return (
              <path
                key={`wash-${region.key}`}
                d={region.path}
                fill={rankFor(domain.score).color}
                opacity="0.22"
              />
            );
          })}
        </g>

        {/* invisible interactive hit areas */}
        <g fill="transparent">
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            return (
              <path
                key={`hit-${region.key}`}
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