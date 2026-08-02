import React, { useState } from "react";
import { REGIONS, OUTLINES, SULCI } from "./brainShapes";

const GLASS_BRAIN = "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a452d7eb7_generated_image.png";
import BrainRankTooltip from "./BrainRankTooltip";
import { rankFor } from "@/lib/ranks";

export default function BrainProfileMap({ domains = [], activeKey, onHover, onSelect }) {
  const [tooltip, setTooltip] = useState(null);
  const byKey = {};
  domains.forEach((d) => { byKey[d.key] = d; });

  const moveTooltip = (event, key) => {
    const svg = event.currentTarget.ownerSVGElement;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const position = point.matrixTransform(svg.getScreenCTM().inverse());
    setTooltip({ key, x: position.x, y: position.y });
  };

  return (
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
              onMouseEnter={(event) => { onHover?.(region.key); moveTooltip(event, region.key); }}
              onMouseMove={(event) => moveTooltip(event, region.key)}
              onMouseLeave={() => { onHover?.(null); setTooltip(null); }}
              onClick={() => onSelect?.(domain)}>
              <path d={region.path} fill={rank.color} fillOpacity="0.55"
                stroke={rank.color} strokeWidth="6" strokeLinejoin="round" />
              <path d={region.path} fill={`url(#glass-${region.key})`}
                className="transition-opacity duration-200"
                opacity={activeKey && activeKey !== region.key ? 0.7 : 1} />
            </g>
          );
        })}

        {/* sulci detail lines over the fills */}
        <g stroke="hsl(var(--background))" strokeWidth="2.5" fill="none" opacity="0.35" pointerEvents="none">
          {SULCI.map((d, i) => <path key={i} d={d} />)}
        </g>

        {/* photoreal glass texture layered over the fills */}
        <image href={GLASS_BRAIN} x="80" y="70" width="500" height="460"
          preserveAspectRatio="xMidYMid slice" opacity="0.65"
          style={{ mixBlendMode: "screen" }} pointerEvents="none" />
        <image href={GLASS_BRAIN} x="80" y="70" width="500" height="460"
          preserveAspectRatio="xMidYMid slice" opacity="0.4"
          style={{ mixBlendMode: "overlay" }} pointerEvents="none" />

        {/* crisp outer outline */}
        <g stroke="hsl(var(--foreground) / 0.5)" strokeWidth="2.5" fill="none" pointerEvents="none">
          {OUTLINES.map((d, i) => <path key={i} d={d} />)}
        </g>
      </g>

      <BrainRankTooltip
        domain={tooltip ? byKey[tooltip.key] : null}
        region={tooltip ? REGIONS.find((item) => item.key === tooltip.key) : null}
        x={tooltip?.x || 0}
        y={tooltip?.y || 0}
      />
    </svg>
  );
}