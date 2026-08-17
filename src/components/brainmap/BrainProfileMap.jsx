import React, { useState, useRef, useEffect } from "react";
import { REGIONS } from "./brainShapes";
import BrainRankTooltip from "./BrainRankTooltip";
import { rankFor } from "@/lib/ranks";

const GLASS_BRAIN = "/images/brain/glass_brain.png";

export default function BrainProfileMap({ domains = [], activeKey, onHover, onSelect }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);
  const [svgWidth, setSvgWidth] = useState(660);
  useEffect(() => {
    const update = () => {
      if (svgRef.current) setSvgWidth(svgRef.current.getBoundingClientRect().width);
    };
    update();
    const ro = new ResizeObserver(update);
    if (svgRef.current) ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);
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
    <svg ref={svgRef} viewBox="0 0 660 560" className="w-full h-full">
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
              <path d={region.path} fill={rank.color} stroke={rank.color} strokeWidth="18" strokeLinejoin="round" />
              <path d={region.path} fill={`url(#glass-${region.key})`} fillOpacity="1"
                className="transition-opacity duration-200"
                opacity={activeKey && activeKey !== region.key ? 0.78 : 1} />
            </g>
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

      <BrainRankTooltip
        domain={tooltip ? byKey[tooltip.key] : null}
        region={tooltip ? REGIONS.find((item) => item.key === tooltip.key) : null}
        x={tooltip?.x || 0}
        y={tooltip?.y || 0}
        svgWidth={svgWidth}
      />
    </svg>
  );
}