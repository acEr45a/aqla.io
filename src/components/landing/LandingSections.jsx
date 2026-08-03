import React from "react";

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
    </>
  );
}