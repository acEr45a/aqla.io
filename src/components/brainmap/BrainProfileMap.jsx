import React, { useState, useRef } from "react";
import { REGIONS, OUTLINES, SULCI } from "./brainShapes";
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
          <clipPath id="brain-clip" clipUnits="userSpaceOnUse">
            {OUTLINES.map((d, i) => <path key={i} d={d} />)}
          </clipPath>
          <filter id="brain-halo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            const rank = rankFor(domain.score);
            return (
              <linearGradient key={`g-${region.key}`} id={`glass-${region.key}`} x1="0" y1="0" x2="0.35" y2="1">
                <stop offset="0%" stopColor={rank.color} stopOpacity="0.92" />
                <stop offset="60%" stopColor={rank.color} stopOpacity="0.62" />
                <stop offset="100%" stopColor={rank.color} stopOpacity="0.85" />
              </linearGradient>
            );
          })}
          <radialGradient id="glass-sheen" cx="0.35" cy="0.2" r="0.75">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="brain-depth" cx="0.5" cy="0.45" r="0.62">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="65%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
          </radialGradient>
          <filter id="sulci-warp" x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.028" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <pattern id="sulci-texture" width="92" height="42" patternUnits="userSpaceOnUse">
            <path d="M-12 10 C10 -2 34 22 58 9 S92 0 110 12" fill="none" stroke="hsl(var(--background))" strokeWidth="2" />
            <path d="M-8 29 C14 17 38 40 62 27 S94 18 108 31" fill="none" stroke="hsl(var(--background))" strokeWidth="1.6" />
          </pattern>
        </defs>

        {/* soft halo bloom around the brain silhouette */}
        <g clipPath="url(#brain-clip)" filter="url(#brain-halo)" opacity="0.4" pointerEvents="none">
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            return <path key={`halo-${region.key}`} d={region.path} fill={rankFor(domain.score).color} fillOpacity="0.6" />;
          })}
        </g>

        {/* filled regions, clipped to the brain outline */}
        <g clipPath="url(#brain-clip)">
          <rect x="80" y="70" width="500" height="460" fill="hsl(var(--muted))" />
          {REGIONS.map((region) => {
            const domain = byKey[region.key];
            if (!domain) return null;
            const rank = rankFor(domain.score);
            return (
              <g key={region.key} className="cursor-pointer"
                onPointerEnter={(e) => { onHover?.(region.key); handlePointer(e, region.key); }}
                onPointerMove={(e) => handlePointer(e, region.key)}
                onPointerDown={(e) => { onHover?.(region.key); handlePointer(e, region.key); }}
                onPointerLeave={() => { onHover?.(null); setTooltip(null); }}
                onClick={() => onSelect?.(domain)}>
                <path d={region.path} fill={rank.color} fillOpacity="0.55"
                  stroke={rank.color} strokeWidth="6" strokeLinejoin="round" />
                <path d={region.path} fill={`url(#glass-${region.key})`}
                  className="transition-opacity duration-200"
                  opacity={activeKey && activeKey !== region.key ? 0.7 : 1} />
              </g>
            );
          })}

        </g>

        {/* cohesive glass sheen + volumetric depth below anatomical linework */}
        <g clipPath="url(#brain-clip)" pointerEvents="none">
          <rect x="80" y="70" width="500" height="460" fill="url(#glass-sheen)" />
          <rect x="80" y="70" width="500" height="460" fill="url(#brain-depth)" />
        </g>

        {/* dense organic sulci, contained inside each anatomical region */}
        <g filter="url(#sulci-warp)" opacity="0.48" pointerEvents="none">
          {REGIONS.map((region) => (
            <path key={`sulci-${region.key}`} d={region.path} fill="url(#sulci-texture)" />
          ))}
        </g>
        <g stroke="hsl(var(--background))" strokeWidth="2" fill="none" opacity="0.42" pointerEvents="none">
          {SULCI.map((d, i) => <path key={i} d={d} />)}
        </g>

        {/* crisp silhouette above glass and sulci */}
        <g stroke="hsl(var(--foreground) / 0.55)" strokeWidth="2.5" fill="none" pointerEvents="none">
          {OUTLINES.map((d, i) => <path key={i} d={d} />)}
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