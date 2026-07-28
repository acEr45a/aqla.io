import React, { useState } from "react";
import { REGIONS } from "./brainShapes";
import BrainRankTooltip from "./BrainRankTooltip";
import { rankFor } from "@/lib/ranks";

const GLASS_BRAIN = "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a452d7eb7_generated_image.png";

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
        <mask id="brain-model-mask" maskUnits="userSpaceOnUse" x="80" y="70" width="500" height="460" style={{ maskType: "luminance" }}>
          <image href={GLASS_BRAIN} x="80" y="70" width="500" height="460" preserveAspectRatio="xMidYMid slice" />
        </mask>
        <filter id="brain-halo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        {REGIONS.map((region) => {
          const domain = byKey[region.key];
          if (!domain) return null;
          const rank = rankFor(domain.score);
          return (
            <linearGradient key={`g-${region.key}`} id={`glass-${region.key}`} x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0%" stopColor={rank.color} stopOpacity="0.9" />
              <stop offset="60%" stopColor={rank.color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={rank.color} stopOpacity="0.8" />
            </linearGradient>
          );
        })}
      </defs>

      {/* hologram bloom around the volume */}
      <g mask="url(#brain-model-mask)" filter="url(#brain-halo)" opacity="0.45" pointerEvents="none">
        {REGIONS.map((region) => {
          const domain = byKey[region.key];
          if (!domain) return null;
          return <path key={`halo-${region.key}`} d={region.path} fill={rankFor(domain.score).color} fillOpacity="0.55" />;
        })}
      </g>

      <g mask="url(#brain-model-mask)">
        {REGIONS.map((region) => {
          const domain = byKey[region.key];
          if (!domain) return null;
          const rank = rankFor(domain.score);
          const active = activeKey === region.key;
          return (
            <path key={region.key} d={region.path} fill={`url(#glass-${region.key})`} fillOpacity={active ? 1 : 0.8}
              stroke={rank.color} strokeWidth={active ? 2.5 : 1} strokeOpacity={active ? 1 : 0.6}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={(event) => { onHover?.(region.key); moveTooltip(event, region.key); }}
              onMouseMove={(event) => moveTooltip(event, region.key)}
              onMouseLeave={() => { onHover?.(null); setTooltip(null); }}
              onClick={() => onSelect?.(domain)} />
          );
        })}

        {/* photoreal 3D glass folds layered over the coloured volumes */}
        <image href={GLASS_BRAIN} x="80" y="70" width="500" height="460"
          preserveAspectRatio="xMidYMid slice" opacity="0.75"
          style={{ mixBlendMode: "screen" }} pointerEvents="none" />
        <image href={GLASS_BRAIN} x="80" y="70" width="500" height="460"
          preserveAspectRatio="xMidYMid slice" opacity="0.45"
          style={{ mixBlendMode: "overlay" }} pointerEvents="none" />
      </g>

      <image href={GLASS_BRAIN} x="80" y="70" width="500" height="460"
        preserveAspectRatio="xMidYMid slice" opacity="0.2"
        style={{ mixBlendMode: "screen" }} pointerEvents="none" />

      {REGIONS.map((region) => {
        const domain = byKey[region.key];
        if (!domain) return null;
        const rank = rankFor(domain.score);
        const [lx, ly] = region.label;
        return (
          <g key={`label-${region.key}`} pointerEvents="none">
            {region.anchor && (
              <line x1={lx} y1={ly} x2={region.anchor[0]} y2={region.anchor[1]}
                stroke={rank.color} strokeOpacity="0.45" strokeWidth="1" />
            )}
            <text x={lx} y={ly} textAnchor="middle" className="font-display" fontSize="18" fontWeight="600" fill={rank.color}>
              {domain.score}
            </text>
            <text x={lx} y={ly + 16} textAnchor="middle" fontSize="12" fill="hsl(35 9% 72%)">
              {domain.label}
            </text>
          </g>
        );
      })}

      <BrainRankTooltip
        domain={tooltip ? byKey[tooltip.key] : null}
        x={tooltip?.x || 0}
        y={tooltip?.y || 0}
      />
    </svg>
  );
}