import React from "react";
import { RANKS } from "@/lib/ranks";

const DESCRIPTIONS = {
  foundational: "Developing consistency; this area has the most room for support.",
  adaptive: "A functional base that adapts to everyday cognitive demands.",
  synchronized: "Balanced, dependable performance across typical demands.",
  resonant: "Strong performance that stays flexible under greater demand.",
  polymath: "Advanced, broad cognitive performance with high consistency.",
  superhuman: "Exceptional performance at the top of the AQLA scale.",
};

export default function RankLegend() {
  return (
    <div className="relative mt-4 flex w-full flex-wrap items-center justify-center overflow-visible rounded-xl border border-border/70 bg-secondary/60 px-2 py-2 shadow-xl md:flex-nowrap md:px-4">
      {RANKS.map((r) => (
        <span key={r.key} tabIndex={0}
          className="group inline-flex flex-1 cursor-help items-center justify-center px-2 py-1 text-xs outline-none md:text-sm"
          style={{ color: r.color }}>
          {r.name}
          <span className="pointer-events-none absolute bottom-full left-0 right-0 z-20 mb-2 hidden rounded-xl border bg-popover px-3 py-2 text-center text-xs leading-relaxed text-popover-foreground shadow-xl group-hover:block group-focus:block"
            style={{ borderColor: `${r.color}80`, boxShadow: `0 10px 30px ${r.color}20` }}>
            <span className="mb-1 block font-medium" style={{ color: r.color }}>{r.name}</span>
            {DESCRIPTIONS[r.key]}
          </span>
        </span>
      ))}
    </div>
  );
}