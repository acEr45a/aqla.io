import React from "react";
import { rankProgress } from "@/lib/ranks";

export default function BrainRankTooltip({ domain, region, x, y, svgWidth = 660 }) {
  if (!domain || !region) return null;
  const { rank, next, pct } = rankProgress(domain.score);
  const remaining = next ? Math.max(0, next.min - domain.score) : 0;
  const tipW = svgWidth < 480 ? 340 : 238;
  const tipH = svgWidth < 480 ? 200 : 162;
  const clampedX = Math.max(8, Math.min(x + 14, 660 - tipW - 8));
  const clampedY = Math.max(8, Math.min(y - tipH - 8, 560 - tipH - 8));

  return (
    <foreignObject x={clampedX} y={clampedY} width={tipW} height={tipH} pointerEvents="none">
      <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-2xl backdrop-blur-md h-full overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{domain.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{region.region}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg leading-none tabular-nums" style={{ color: rank.color }}>{domain.score}</p>
            <p className="mt-1 text-xs" style={{ color: rank.color }}>{rank.name}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{region.role}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: rank.color }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {next ? <><span className="text-foreground">{remaining} points</span> to {next.name}</> : "Highest rank achieved"}
        </p>
      </div>
    </foreignObject>
  );
}