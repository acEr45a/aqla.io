import React, { useState, useRef } from "react";
import { REGIONS, OUTLINES } from "./brainShapes";
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
          <clipPath id="brain-clip" clipUnits="userSpaceOnUse">
            {OUTLINES.map((d, i) => <path key={i} d={d} />)}
          </clipPath>
          <filter id="region-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feMorphology operator="dilate" radius="6" />
            <feGaussianBlur stdDeviation="8" />
          </filter>
          {/* luminance mask from the brain image itself — glows can only appear on the brain */}
          <mask id="brain-lum" maskUnits="userSpaceOnUse" x="0" y="0" width="660" height="560">
            <image href={BRAIN_IMAGE} x="30" y="10" width="600" height="540" preserveAspectRatio="xMidYMid meet" />
          </mask>
        </defs>

        {/* photoreal glass brain — the actual brain visual */}
        <image
          href={BRAIN_IMAGE}
          x="30" y="10" width="600" height="540"
          preserveAspectRatio="xMidYMid meet"
          pointerEvents="none"
        />

        {/* strong hue tint per region, following the glass surface */}
        <g mask="url(#brain-lum)" pointerEvents="none" style={{ mixBlendMode: "color" }}>
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            const rank = rankFor(domain.score);
            const dim = activeKey && activeKey !== region.key;
            return (
              <path
                key={`tint-${region.key}`}
                d={region.path}
                fill={rank.color}
                filter="url(#region-glow)"
                className="transition-opacity duration-300"
                opacity={dim ? 0.6 : 1}
              />
            );
          })}
        </g>

        {/* soft volumetric color glow, blended into the glass */}
        <g mask="url(#brain-lum)" pointerEvents="none" style={{ mixBlendMode: "screen" }}>
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            const rank = rankFor(domain.score);
            const dim = activeKey && activeKey !== region.key;
            return (
              <path
                key={`glow-${region.key}`}
                d={region.path}
                fill={rank.color}
                filter="url(#region-glow)"
                className="transition-opacity duration-300"
                opacity={dim ? 0.4 : 0.85}
              />
            );
          })}
        </g>

        {/* saturated fill so each region reads as a solid, bright zone */}
        <g mask="url(#brain-lum)" pointerEvents="none" style={{ mixBlendMode: "hard-light" }}>
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            const rank = rankFor(domain.score);
            const dim = activeKey && activeKey !== region.key;
            return (
              <path
                key={`fill-${region.key}`}
                d={region.path}
                fill={rank.color}
                filter="url(#region-glow)"
                className="transition-opacity duration-300"
                opacity={dim ? 0.3 : 0.6}
              />
            );
          })}
        </g>

        {/* active region accent — a slightly tighter, brighter core */}
        <g mask="url(#brain-lum)" pointerEvents="none" style={{ mixBlendMode: "screen" }}>
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain || activeKey !== region.key) return null;
            return (
              <path
                key={`core-${region.key}`}
                d={region.path}
                fill={rankFor(domain.score).color}
                filter="url(#region-glow)"
                opacity="0.45"
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