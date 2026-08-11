import React from "react";
import { FlaskConical, Package } from "lucide-react";

export default function Toolkit() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* ── Header (kept for brand recognition) ── */}
      <div className="flex items-center gap-2.5">
        <Package className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Formulas</p>
      </div>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">AQLA Labs</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-xl">
        Formulas matched to your cognitive profile — with supply and delivery tracked on each card.
      </p>

      {/* ── Coming Soon panel ── */}
      <div className="mt-8 aqla-panel rounded-3xl px-6 py-16 text-center">
        <div className="relative mx-auto w-14 h-14 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping [animation-duration:2.5s]" />
          <span className="absolute inset-0 rounded-full border border-primary/30" />
          <Package className="relative w-6 h-6 text-primary" strokeWidth={1.5} />
        </div>
        <p className="mt-6 text-xs uppercase tracking-widest text-primary">Coming Soon</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Personalised formulas matched to your protocol — arriving soon.
        </p>
      </div>

      {/* ── Experiments Section ── */}
      <div className="mt-14 flex items-center gap-2.5">
        <FlaskConical className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Personal experiments</p>
      </div>
      <h2 className="mt-2 text-2xl md:text-3xl font-light text-foreground">N-of-1 experiments</h2>
      <p className="mt-3 text-sm text-muted-foreground max-w-xl">
        AQLA never assumes an intervention works. It measures your personal response.
      </p>

      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary border border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
          Personal experiments — coming in a future release
        </span>
      </div>
    </div>
  );
}