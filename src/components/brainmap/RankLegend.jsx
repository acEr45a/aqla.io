import React from "react";
import { RANKS } from "@/lib/ranks";

export default function RankLegend() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {RANKS.map((r) => (
        <span key={r.key} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
          {r.name}
        </span>
      ))}
    </div>
  );
}