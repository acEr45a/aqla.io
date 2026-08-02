import React from "react";
import BrainGLBView from "./BrainGLBView";
import RankLegend from "./RankLegend";

export default function NeuralBrainVisual({ domains = [], onSelect, selectedKey }) {
  const selected = domains.find((d) => d.key === selectedKey) || domains[0];
  const tint = selected?.color || "#C9F24E";

  return (
    <div className="mx-auto w-full max-w-[900px] select-none">
      <div className="relative aspect-[660/560] w-full overflow-hidden rounded-3xl border border-border/50 bg-background shadow-2xl">
        <BrainGLBView tint={tint} />
        <div className="pointer-events-none absolute bottom-[5%] left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          ↻&nbsp; Drag to inspect · 360°
        </div>
      </div>

      {/* Domain selector chips — drives the insights panel */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {domains.map((d) => {
          const isActive = d.key === selectedKey;
          return (
            <button
              key={d.key}
              onClick={() => onSelect?.(d)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition ${
                isActive
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              {d.label}
              <span className="tabular-nums opacity-70">{d.score}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {selected ? `${selected.label} · score ${selected.score}/100` : "Select a domain to explore its insights."}
      </p>
      <RankLegend />
    </div>
  );
}