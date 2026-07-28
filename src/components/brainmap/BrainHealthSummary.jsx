import React from "react";

const band = (score) =>
  score >= 80 ? "strong" : score >= 65 ? "solid" : score >= 50 ? "mixed" : "under strain";

export default function BrainHealthSummary({ domains, compact = false }) {
  if (!domains?.length) return null;
  const overall = Math.round(domains.reduce((a, d) => a + d.score, 0) / domains.length);
  const sorted = [...domains].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <div className={`aqla-panel rounded-2xl ${compact ? "px-4 py-3.5" : "p-6"}`}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Brain health summary</p>
        <p className={`font-display font-light text-foreground tabular-nums ${compact ? "text-xl" : "text-3xl"}`}>
          {overall}<span className="text-xs text-muted-foreground"> / 100</span>
        </p>
      </div>
      <p className={`mt-2 text-muted-foreground leading-relaxed ${compact ? "text-[11px]" : "text-sm"}`}>
        Overall cognitive condition looks <span className="text-foreground">{band(overall)}</span>.
        Your strongest domain is <span style={{ color: strongest.color }}>{strongest.label}</span> ({strongest.score}),
        and <span style={{ color: weakest.color }}>{weakest.label}</span> ({weakest.score}) is currently the
        biggest limiter — improving it lifts everything downstream of it.
      </p>
      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          {sorted.map((d) => (
            <span key={d.key} className="px-2.5 py-1 rounded-full border text-[11px] tabular-nums"
              style={{ borderColor: `${d.color}44`, color: d.color }}>
              {d.label} {d.score}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}