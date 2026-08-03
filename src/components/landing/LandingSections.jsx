import React from "react";
import { FileDown } from "lucide-react";

const LOOP = [
  "Measure your baseline",
  "Identify your primary bottleneck",
  "Receive a personalized protocol",
  "Test what works",
  "Adapt over time",
];

export default function LandingSections() {
  return (
    <>
      {/* How AQLA works — the methodology loop */}
      <section id="science" className="border-y border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-24">
          <p className="text-sm text-muted-foreground tracking-widest uppercase mb-8 md:mb-12">How AQLA works</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border/40">
            {LOOP.map((step, i) => (
              <div key={i} className="bg-background p-5 md:p-8">
                <span className="font-display text-2xl md:text-3xl text-primary/70 tabular-nums">0{i + 1}</span>
                <p className="mt-3 md:mt-4 text-sm text-foreground/90 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal experiments — concrete example */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-28 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <p className="text-sm text-muted-foreground tracking-widest uppercase mb-5">Personal experiments</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground leading-tight">
            AQLA never assumes a recommendation works.
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Every intervention becomes a controlled personal experiment — baseline, intervention, and honest analysis
            of your own response. Correlation is never presented as fact.
          </p>
        </div>
        <div className="aqla-panel rounded-2xl p-6 md:p-8">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Sample result</p>
          <p className="mt-3 font-display text-lg text-foreground">Delaying caffeine until after breakfast</p>
          <div className="mt-6 space-y-3 text-sm">
            {[["Sustained attention", "+8%", "#C9F24E"], ["Afternoon energy", "+12%", "#C9F24E"], ["Sleep latency", "unchanged", "#8b8578"]].map(([m, v, c]) => (
              <div key={m} className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{m}</span>
                <span className="tabular-nums font-medium" style={{ color: c }}>{v}</span>
              </div>
            ))}
            <p className="pt-2 text-muted-foreground">Confidence: moderate · Verdict: <span className="text-foreground">likely beneficial</span></p>
          </div>
        </div>
      </section>

      {/* Daily plan PDF highlight */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
        <div className="aqla-panel rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
          <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FileDown className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground tracking-widest uppercase mb-3">Your day, on paper</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-foreground leading-tight">
              Download a branded daily plan — refreshed every morning.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
              A clean, step-by-step PDF of today's protocol actions, readiness signals, and focus areas.
              Print it, pin it, or keep it on your phone — your plan renews automatically as your data updates each day.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}