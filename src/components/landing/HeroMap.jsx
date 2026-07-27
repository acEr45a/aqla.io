import React, { useRef, useState } from "react";

const NODES = [
  { label: "Focus", color: "#7B94FF", x: 0.5, y: 0.12 },
  { label: "Memory", color: "#A9B9FF", x: 0.88, y: 0.34 },
  { label: "Energy", color: "#C9F24E", x: 0.8, y: 0.78 },
  { label: "Sleep", color: "#5FD4E8", x: 0.5, y: 0.94 },
  { label: "Stress", color: "#F2C04E", x: 0.2, y: 0.78 },
  { label: "Recovery", color: "#8FE8C2", x: 0.12, y: 0.34 },
];

export default function HeroMap() {
  const ref = useRef(null);
  const [m, setM] = useState({ x: 0.5, y: 0.5 });

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setM({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };

  const S = 480;
  const shift = (n) => {
    const dx = (m.x - n.x) * 18;
    const dy = (m.y - n.y) * 18;
    return { x: n.x * S + dx, y: n.y * S + dy };
  };
  const pts = NODES.map(shift);
  const cx = S / 2 + (m.x - 0.5) * 10;
  const cy = S / 2 + (m.y - 0.5) * 10;

  return (
    <div ref={ref} onMouseMove={onMove} className="relative">
      <svg viewBox={`0 0 ${S} ${S}`} className="w-full h-auto">
        {pts.map((p, i) => (
          <g key={i}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={NODES[i].color} strokeOpacity="0.35" strokeWidth="1.2" style={{ transition: "all 0.15s ease-out" }} />
            <line x1={p.x} y1={p.y} x2={pts[(i + 1) % pts.length].x} y2={pts[(i + 1) % pts.length].y}
              stroke="hsl(35 9% 45%)" strokeOpacity="0.18" strokeWidth="1" style={{ transition: "all 0.15s ease-out" }} />
          </g>
        ))}
        <circle cx={cx} cy={cy} r="6" fill="hsl(40 24% 93%)" />
        <circle cx={cx} cy={cy} r="18" fill="none" stroke="hsl(40 24% 93%)" strokeOpacity="0.2">
          <animate attributeName="r" values="14;24;14" dur="6s" repeatCount="indefinite" />
        </circle>
        {pts.map((p, i) => (
          <g key={`n-${i}`} style={{ transition: "all 0.15s ease-out" }}>
            <circle cx={p.x} cy={p.y} r="22" fill={NODES[i].color} fillOpacity="0.08" />
            <circle cx={p.x} cy={p.y} r="8" fill={NODES[i].color} fillOpacity="0.85" />
            <text x={p.x} y={p.y - 18} textAnchor="middle" fill="hsl(35 12% 70%)" fontSize="13" fontFamily="Space Grotesk">
              {NODES[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}