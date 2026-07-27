import React, { useState } from "react";

export default function RadialMap({ domains = [], size = 420, onSelect, selectedKey, revealCount }) {
  const [hover, setHover] = useState(null);
  const c = size / 2;
  const R = size * 0.38;
  const shown = revealCount != null ? domains.slice(0, revealCount) : domains;

  const pos = (i) => {
    const a = (i / domains.length) * Math.PI * 2 - Math.PI / 2;
    return { x: c + Math.cos(a) * R, y: c + Math.sin(a) * R };
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto select-none" role="img" aria-label="Brain Health Map">
      <circle cx={c} cy={c} r={R} fill="none" stroke="hsl(30 9% 18%)" strokeWidth="1" strokeDasharray="2 5" />
      <circle cx={c} cy={c} r={R * 0.55} fill="none" stroke="hsl(30 9% 14%)" strokeWidth="1" strokeDasharray="2 5" />
      {shown.map((d, i) => {
        const p = pos(domains.indexOf(d));
        const active = hover === d.key || selectedKey === d.key;
        return (
          <line key={`l-${d.key}`} x1={c} y1={c} x2={p.x} y2={p.y} stroke={d.color}
            strokeWidth={active ? 2 : 1.2} strokeOpacity={0.15 + (d.score / 100) * 0.55}
            style={{ transition: "all 0.6s ease" }} />
        );
      })}
      <circle cx={c} cy={c} r={7} fill="hsl(40 24% 93%)" fillOpacity="0.9" />
      <circle cx={c} cy={c} r={16} fill="none" stroke="hsl(40 24% 93%)" strokeOpacity="0.25" strokeWidth="1">
        <animate attributeName="r" values="12;20;12" dur="5s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.3;0.08;0.3" dur="5s" repeatCount="indefinite" />
      </circle>
      {shown.map((d) => {
        const i = domains.indexOf(d);
        const p = pos(i);
        const r = 5 + (d.score / 100) * 10;
        const active = hover === d.key || selectedKey === d.key;
        const labelOut = 26;
        const a = (i / domains.length) * Math.PI * 2 - Math.PI / 2;
        const lx = c + Math.cos(a) * (R + labelOut);
        const ly = c + Math.sin(a) * (R + labelOut);
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <g key={d.key} onMouseEnter={() => setHover(d.key)} onMouseLeave={() => setHover(null)}
            onClick={() => onSelect && onSelect(d)} style={{ cursor: onSelect ? "pointer" : "default" }}>
            <circle cx={p.x} cy={p.y} r={r + 8} fill={d.color} fillOpacity={active ? 0.15 : 0.06} style={{ transition: "all 0.4s" }} />
            <circle cx={p.x} cy={p.y} r={r} fill={d.color} fillOpacity={active ? 0.95 : 0.75} style={{ transition: "all 0.4s" }} />
            <text x={lx} y={ly} textAnchor={anchor} fill={active ? "hsl(40 24% 93%)" : "hsl(35 9% 58%)"}
              fontSize={size * 0.028} fontFamily="Space Grotesk" style={{ transition: "fill 0.3s" }}>
              {d.label}
            </text>
            <text x={lx} y={ly + size * 0.035} textAnchor={anchor} fill={d.color} fontSize={size * 0.03}
              fontFamily="Space Grotesk" fontWeight="600" className="tabular-nums"
              opacity={d.score != null ? 1 : 0}>
              {d.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}