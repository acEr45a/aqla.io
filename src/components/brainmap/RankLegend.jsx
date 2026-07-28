import React from "react";
import { RANKS } from "@/lib/ranks";

export default function RankLegend() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      {RANKS.map((r) => (
        <span key={r.key}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-3.5 py-1.5 text-xs md:text-sm text-foreground/90">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }} />
          {r.name}
        </span>
      ))}
    </div>
  );
}