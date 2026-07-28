import React from "react";
import { rankProgress } from "@/lib/ranks";

export default function BrainRankTooltip({ domain, x, y }) {
  if (!domain) return null;
  const { rank, next, pct } = rankProgress(domain.score);
  const remaining = next ? Math.max(0, next.min - domain.score) : 0;

  return (
    <foreignObject x={Math.min(x + 14, 464)} y={Math.max(y - 92, 8)} width="184" height="84" pointerEvents="none">
      <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-foreground">{domain.label}</span>
          <span className="tabular-nums" style={{ color: rank.color }}>{domain.score}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: rank.color }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {next ? <><span className="text-foreground">{remaining} points</span> to {next.name}</> : "Top rank reached"}
        </p>
      </div>
    </foreignObject>
  );
}