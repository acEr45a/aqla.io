import React from "react";

// Two-track bar: the community average vs your own value, on a 0-max scale.
export default function ComparisonBar({ label, community, you, max = 10, suffix = "" }) {
  const w = (v) => (typeof v === "number" ? Math.min(100, (v / max) * 100) : 0);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 mb-2">
        <span className="text-sm text-foreground/90 capitalize">{label}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          You {you ?? "—"}{you != null ? suffix : ""} · Community {community ?? "—"}{community != null ? suffix : ""}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary/80 transition-all duration-700" style={{ width: `${w(you)}%` }} />
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-muted-foreground/50 transition-all duration-700" style={{ width: `${w(community)}%` }} />
        </div>
      </div>
    </div>
  );
}