import React from "react";

const SEGMENTS = [
  { from: 0, to: 40, color: "#E5533C" },   // red
  { from: 40, to: 60, color: "#E8873A" },  // orange
  { from: 60, to: 80, color: "#E8C63A" },  // yellow
  { from: 80, to: 100, color: "#7BC950" }, // green
];

const polar = (cx, cy, r, pct) => {
  const angle = Math.PI * (1 - pct / 100); // 180° sweep, left to right
  return [cx + r * Math.cos(angle), cy - r * Math.sin(angle)];
};

const arcPath = (cx, cy, r, fromPct, toPct) => {
  const [x1, y1] = polar(cx, cy, r, fromPct);
  const [x2, y2] = polar(cx, cy, r, toPct);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
};

export default function HealthGauge({ score = 0 }) {
  const cx = 100, cy = 95, r = 78;
  const needleAngle = Math.PI * (1 - score / 100);
  const nx = cx + (r - 16) * Math.cos(needleAngle);
  const ny = cy - (r - 16) * Math.sin(needleAngle);
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Fair" : score >= 40 ? "Degraded" : "Critical";
  const labelColor = SEGMENTS.find((s) => score >= s.from && score <= s.to)?.color || SEGMENTS[0].color;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-[240px]">
        {SEGMENTS.map((seg) => (
          <path key={seg.from} d={arcPath(cx, cy, r, seg.from + 1, seg.to - 1)}
            stroke={seg.color} strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.9" />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="hsl(var(--foreground))" />
      </svg>
      <p className="-mt-2 font-display text-4xl text-foreground tabular-nums">{score}<span className="text-base text-muted-foreground"> /100</span></p>
      <p className="mt-1 text-xs font-medium uppercase tracking-widest" style={{ color: labelColor }}>{label}</p>
    </div>
  );
}