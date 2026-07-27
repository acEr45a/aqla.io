import React, { useRef, useState } from "react";

const NODES = [
  { label: "Focus", color: "#7B94FF", x: 0.5, y: 0.12, desc: "How long and how deeply you can hold attention on demanding work." },
  { label: "Memory", color: "#A9B9FF", x: 0.88, y: 0.34, desc: "How well you retain and recall information under real-world load." },
  { label: "Energy", color: "#C9F24E", x: 0.8, y: 0.78, desc: "Your mental stamina across the day — including afternoon crashes." },
  { label: "Sleep", color: "#5FD4E8", x: 0.5, y: 0.94, desc: "How completely your brain recovers overnight, night after night." },
  { label: "Stress", color: "#F2C04E", x: 0.2, y: 0.78, desc: "How well you regulate pressure before it erodes clarity and focus." },
  { label: "Recovery", color: "#8FE8C2", x: 0.12, y: 0.34, desc: "Your ability to bounce back after intense cognitive effort." },
];

export default function HeroMap() {
  const ref = useRef(null);
  const [m, setM] = useState({ x: 0.5, y: 0.5 });
  const [hover, setHover] = useState(null);

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
          <g key={`n-${i}`} style={{ transition: "all 0.15s ease-out", cursor: "pointer" }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={p.x} cy={p.y} r="28" fill="transparent" />
            <circle cx={p.x} cy={p.y} r={hover === i ? 30 : 22} fill={NODES[i].color} fillOpacity={hover === i ? 0.16 : 0.08} style={{ transition: "all 0.3s" }} />
            <circle cx={p.x} cy={p.y} r={hover === i ? 10 : 8} fill={NODES[i].color} fillOpacity={hover === i ? 1 : 0.85} style={{ transition: "all 0.3s" }} />
            <text x={p.x} y={p.y - 18} textAnchor="middle" fill={hover === i ? "hsl(40 24% 93%)" : "hsl(35 12% 70%)"} fontSize="13" fontFamily="Space Grotesk" style={{ transition: "fill 0.3s" }}>
              {NODES[i].label}
            </text>
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="absolute pointer-events-none z-10 w-52 aqla-panel rounded-xl p-3.5"
          style={{
            left: `${Math.min(Math.max((pts[hover].x / S) * 100, 12), 88)}%`,
            top: `${(pts[hover].y / S) * 100}%`,
            transform: `translate(-50%, ${NODES[hover].y > 0.5 ? "-130%" : "24px"})`,
          }}>
          <p className="text-xs font-medium" style={{ color: NODES[hover].color }}>{NODES[hover].label}</p>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{NODES[hover].desc}</p>
        </div>
      )}
    </div>
  );
}