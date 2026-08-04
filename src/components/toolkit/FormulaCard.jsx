import React from "react";
import { Truck } from "lucide-react";

// Test implementation — mock supply data per formula family.
const SUPPLY_BY_KEY = {
  SPARK: { status: "Supplied", eta: "Aug 10", qty: "60 caps" },
  FLOW: { status: "In transit", eta: "Aug 8", qty: "30 caps" },
  DRIVE: { status: "Supplied", eta: "Aug 14", qty: "90 caps" },
  LEARN: { status: "Processing", eta: "Aug 12", qty: "30 caps" },
  RESET: { status: "Supplied", eta: "Aug 10", qty: "30 caps" },
};

export default function FormulaCard({ formula }) {
  const supply = SUPPLY_BY_KEY[formula.key];
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
      {supply && (
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2.5">
          <Truck className="w-3.5 h-3.5 text-primary" strokeWidth={1.75} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Supply</p>
            <p className="mt-0.5 text-xs text-foreground">
              <span className="text-primary/90">{supply.status}</span>
              <span className="text-muted-foreground"> · {supply.qty} · next {supply.eta}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}