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
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      {RANKS.map((r) => (
        <span key={r.key} tabIndex={0}
          className="group relative inline-flex cursor-help items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs text-foreground/90 outline-none md:text-sm"
          style={{ borderColor: `${r.color}66`, background: `${r.color}12` }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }} />
          {r.name}
          <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-52 -translate-x-1/2 rounded-xl border bg-popover px-3 py-2 text-center text-xs leading-relaxed text-popover-foreground shadow-xl group-hover:block group-focus:block"
            style={{ borderColor: `${r.color}80`, boxShadow: `0 10px 30px ${r.color}20` }}>
            <span className="mb-1 block font-medium" style={{ color: r.color }}>{r.name}</span>
            {DESCRIPTIONS[r.key]}
          </span>
        </span>
      ))}
    </div>
  );
}