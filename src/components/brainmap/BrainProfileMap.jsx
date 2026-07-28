import React from "react";
import { OUTLINES, SULCI, REGIONS } from "./brainShapes";
import { rankFor } from "@/lib/ranks";

export default function BrainProfileMap({ domains = [], activeKey, onHover, onSelect }) {
  const byKey = {};
  domains.forEach((d) => { byKey[d.key] = d; });

  return (
    <svg viewBox="0 0 660 560" className="w-full h-full">
      <defs>
        <clipPath id="brain-sulci-clip">
          {REGIONS.map((r) => <path key={r.key} d={r.path} />)}
        </clipPath>
        <filter id="brain-halo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <linearGradient id="brain-sheen" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {REGIONS.map((region) => {
          const domain = byKey[region.key];
          if (!domain) return null;
          const rank = rankFor(domain.score);
          return (
            <linearGradient key={`g-${region.key}`} id={`glass-${region.key}`} x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0%" stopColor={rank.color} stopOpacity="0.95" />
              <stop offset="55%" stopColor={rank.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={rank.color} stopOpacity="0.85" />
            </linearGradient>
          );
        })}
      </defs>

      {/* outer hologram glow */}
      <g filter="url(#brain-halo)" opacity="0.5" pointerEvents="none">
        {REGIONS.map((region) => {
          const domain = byKey[region.key];
          if (!domain) return null;
          return <path key={`halo-${region.key}`} d={region.path} fill={rankFor(domain.score).color} fillOpacity="0.5" />;
        })}
      </g>

      {OUTLINES.map((d, i) => (
        <path key={i} d={d} fill="hsl(26 12% 9%)" stroke="hsl(30 12% 26%)" strokeWidth="1.5" />
      ))}

      {REGIONS.map((region) => {
        const domain = byKey[region.key];
        if (!domain) return null;
        const rank = rankFor(domain.score);
        const active = activeKey === region.key;
        return (
          <g key={region.key}>
            <path d={region.path} fill={`url(#glass-${region.key})`} fillOpacity={active ? 1 : 0.82}
              stroke={rank.color} strokeWidth={active ? 2.5 : 1.2} strokeOpacity={active ? 1 : 0.75}
              className="cursor-pointer transition-all duration-200"
              style={{ filter: active ? `drop-shadow(0 0 12px ${rank.color})` : "none" }}
              onMouseEnter={() => onHover?.(region.key)}
              onMouseLeave={() => onHover?.(null)}
              onClick={() => onSelect?.(domain)} />
            <path d={region.path} fill="url(#brain-sheen)" pointerEvents="none" />
          </g>
        );
      })}

      {/* gyral pattern etched across every region */}
      <g clipPath="url(#brain-sulci-clip)" pointerEvents="none">
        {SULCI.map((d, i) => (
          <path key={`shadow-${i}`} d={d} fill="none" stroke="hsl(26 20% 5%)" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
        ))}
        {SULCI.map((d, i) => (
          <path key={`light-${i}`} d={d} fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.2" strokeLinecap="round" transform="translate(0,-2.5)" />
        ))}
      </g>

      {OUTLINES.map((d, i) => (
        <path key={`edge-${i}`} d={d} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" pointerEvents="none" />
      ))}

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
    </svg>
  );
}