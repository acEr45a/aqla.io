import React from "react";
import { Package, Truck } from "lucide-react";

// Preview state — feature not yet live. Mock data shown behind a Coming Soon badge.
const MOCK_SUPPLY = {
  status: "in_transit",
  formula: "Focus — SPARK",
  cycle: "Cycle 2, Week 1",
  eta: "Aug 10",
  items: [
    { name: "L-Tyrosine 500mg", qty: 60, active: true },
    { name: "Alpha-GPC 300mg", qty: 30, active: true },
    { name: "L-Theanine 200mg", qty: 30, active: true },
  ],
};

export default function FormulaLogisticsCard() {
  const { status, formula, cycle, eta, items } = MOCK_SUPPLY;
  const inTransit = status === "in_transit";

  return (
    <div data-tour="supply" className="relative mt-8 aqla-panel rounded-3xl p-5 md:p-6">
      <span className="absolute top-3 right-3 rounded-full bg-secondary border border-border px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        Coming Soon
      </span>

      <div className="flex items-center gap-2.5">
        <Package className="w-4 h-4 text-primary" strokeWidth={1.75} />
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Formula Logistics</p>
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-display text-lg text-foreground">{formula}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{cycle} · {items.length} active formulas supplied</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3">
          <Truck className={`w-4 h-4 ${inTransit ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.75} />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Next delivery</p>
            <p className="font-display text-sm text-foreground tabular-nums">{eta}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-px rounded-2xl overflow-hidden border border-border/60">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-card/60 px-4 py-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
            <p className="flex-1 text-sm text-foreground">{item.name}</p>
            <span className="text-xs text-muted-foreground tabular-nums">{item.qty} caps</span>
            <span className="text-[10px] uppercase tracking-widest text-primary/80">Supplied</span>
          </div>
        ))}
      </div>
    </div>
  );
}