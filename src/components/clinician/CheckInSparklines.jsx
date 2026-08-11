import React from "react";

// Compact inline sparkline bars for the last 14 daily check-ins.
// Each metric is a 1-10 scale rendered as a row of vertical bars.
const METRICS = [
  { key: "clarity", label: "Clarity", color: "#C9F24E" },
  { key: "energy", label: "Energy", color: "#7B94FF" },
  { key: "stress", label: "Stress", color: "#E8756B" },
  { key: "sleep_quality", label: "Sleep", color: "#5FD4E8" },
];

function SparkRow({ label, color, values }) {
  const max = 10;
  return (
    <div className="flex items-center gap-3">
      <p className="w-14 shrink-0 text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-1 items-end gap-0.5 h-10">
        {values.length === 0 ? (
          <p className="text-[11px] text-muted-foreground self-center">No data</p>
        ) : values.map((v, i) => {
          const h = v == null ? 0 : Math.max((v / max) * 100, 6);
          return (
            <div
              key={i}
              className="flex-1 min-w-[3px] rounded-sm transition-all"
              style={{ height: `${h}%`, background: v == null ? "transparent" : color, opacity: v == null ? 0.2 : 0.85 }}
              title={v != null ? `${v}/10` : "No entry"}
            />
          );
        })}
      </div>
      {values.length > 0 && (
        <p className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
          {(values.filter((v) => v != null).reduce((a, b) => a + b, 0) / values.filter((v) => v != null).length).toFixed(1)}
        </p>
      )}
    </div>
  );
}

export default function CheckInSparklines({ checkIns }) {
  // Oldest → newest so the trend reads left to right.
  const ordered = [...(checkIns || [])].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-14);
  return (
    <div className="space-y-3">
      {METRICS.map((m) => (
        <SparkRow key={m.key} label={m.label} color={m.color} values={ordered.map((c) => c[m.key])} />
      ))}
    </div>
  );
}