import React from "react";

export default function FormulaCard({ formula }) {
  return (
    <div className="aqla-panel rounded-2xl p-5 md:p-6 group hover:border-foreground/20 transition-colors">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: formula.color }} />
        <span className="font-display text-sm text-foreground tracking-wide">{formula.name}</span>
        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{formula.evidence}</span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{formula.direction}</p>
      <div className="mt-4 pt-4 border-t border-border/40">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Suitable for</p>
        <p className="mt-1.5 text-xs text-muted-foreground/40 italic">To be added.</p>
      </div>
      <div className="mt-3 pt-3 border-t border-border/40">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Ingredients</p>
        <p className="mt-1.5 text-xs text-muted-foreground/40 italic">To be added.</p>
      </div>
      <div className="mt-3 pt-3 border-t border-border/40">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Benefits</p>
        <p className="mt-1.5 text-xs text-muted-foreground/40 italic">To be added.</p>
      </div>
    </div>
  );
}