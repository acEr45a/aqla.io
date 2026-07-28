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
      </defs>

      {OUTLINES.map((d, i) => (
        <path key={i} d={d} fill="hsl(26 9% 12%)" stroke="hsl(30 9% 22%)" strokeWidth="1.5" />
      ))}

      {REGIONS.map((region) => {
        const domain = byKey[region.key];
        if (!domain) return null;
        const rank = rankFor(domain.score);
        const active = activeKey === region.key;
        return (
          <path key={region.key} d={region.path}
            fill={rank.color} fillOpacity={active ? 1 : 0.92}
            stroke="hsl(26 14% 6%)" strokeWidth={active ? 3 : 1.5}
            strokeOpacity={active ? 1 : 0.7}
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => onHover?.(region.key)}
            onMouseLeave={() => onHover?.(null)}
            onClick={() => onSelect?.(domain)} />
        );
      })}

      <g clipPath="url(#brain-sulci-clip)" pointerEvents="none">
        {SULCI.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="hsl(26 14% 6%)" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
        ))}
      </g>

      {OUTLINES.map((d, i) => (
        <path key={`edge-${i}`} d={d} fill="none" stroke="hsl(30 9% 30%)" strokeWidth="1.5" pointerEvents="none" />
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
            <text x={lx} y={ly + 16} textAnchor="middle" fontSize="12" fill="hsl(35 9% 70%)">
              {domain.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}