import React from "react";
import { rankFor } from "@/lib/ranks";

export default function BrainHealthSummary({ domains, compact = false }) {
  if (!domains?.length) return null;
  const overall = Math.round(domains.reduce((a, d) => a + d.score, 0) / domains.length);
  const sorted = [...domains].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const overallRank = rankFor(overall);
  const strongRank = rankFor(strongest.score);
  const weakRank = rankFor(weakest.score);

  return (
    <div className={`aqla-panel rounded-2xl ${compact ? "px-4 py-3.5" : "p-6"}`}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Brain health summary</p>
        <p className={`font-display font-light tabular-nums ${compact ? "text-xl" : "text-3xl"}`} style={{ color: overallRank.color }}>
          {overall}<span className="text-xs text-muted-foreground"> / 100</span>
        </p>
      </div>
      <p className={`mt-2 text-muted-foreground leading-relaxed ${compact ? "text-[11px]" : "text-sm"}`}>
        Overall cognitive condition sits at <span style={{ color: overallRank.color }}>{overallRank.name}</span>.
        Your strongest domain is <span style={{ color: strongRank.color }}>{strongest.label}</span> ({strongest.score}),
        and <span style={{ color: weakRank.color }}>{weakest.label}</span> ({weakest.score}) is currently the
        biggest limiter — improving it lifts everything downstream of it.
      </p>
      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          {sorted.map((d) => {
            const r = rankFor(d.score);
            return (
              <span key={d.key} className="px-2.5 py-1 rounded-full border text-[11px] tabular-nums"
                style={{ borderColor: `${r.color}44`, color: r.color, backgroundColor: `${r.color}12` }}>
                {d.label} {d.score}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}