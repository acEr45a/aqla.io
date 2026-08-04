import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Package, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import FormulaCard from "@/components/toolkit/FormulaCard";
import AqlaLogo from "@/components/AqlaLogo";

const CONF = {
  too_early: "Too early to tell", possible_benefit: "Possible benefit", likely_benefit: "Likely benefit",
  no_clear_effect: "No clear effect", possible_negative: "Possible negative effect", likely_negative: "Likely negative effect",
};

const PHASES = ["baseline", "intervention", "analysis", "complete"];

const FORMULA_FAMILIES = PROTOCOL_FAMILIES.filter((f) => f.key !== "DIGITAL");

export default function Toolkit() {
  const [experiments, setExperiments] = useState(null);

  useEffect(() => {
    base44.entities.Experiment.list("-created_date").then(setExperiments);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* ── Formulas Section ── */}
      <div className="flex items-center gap-2.5">
        <Package className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Formulas</p>
      </div>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">AQLA Labs</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-xl">
        Two pillars of your protocol: <span className="text-foreground">Formulas</span> matched to your cognitive profile, and the <span className="text-foreground">Dispensary</span> that ships them to your door.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {FORMULA_FAMILIES.map((f) => (
          <FormulaCard key={f.key} formula={f} />
        ))}
      </div>

      {/* ── Dispensary Section ── */}
      <div className="mt-14 flex items-center gap-2.5">
        <ShoppingBag className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">AQLA Labs Dispensary</p>
      </div>
      <h2 className="mt-2 text-2xl md:text-3xl font-light text-foreground">Your protocol, delivered.</h2>
      <p className="mt-3 text-sm text-muted-foreground max-w-xl">
        AQLA Labs boxes arrive with the exact formulas matched to your cognitive profile — branded, batched, and built for the bottleneck you're working on.
      </p>

      <div className="mt-8 relative overflow-hidden rounded-3xl border border-border/60 aqla-panel p-8 md:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <AqlaLogo showWordmark={false} className="text-foreground" />
            <span className="font-display text-lg tracking-tight text-foreground">AQLA Labs Dispensary</span>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-primary">Coming soon</p>
          <p className="mt-3 text-lg md:text-xl text-foreground font-light leading-relaxed max-w-md">
            Supplement boxes tailored to your brain — launching soon.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Fulfillment and checkout are still being built. Check back here when the Dispensary goes live.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-10 -bottom-10 opacity-20">
          <Package className="w-56 h-56 text-primary" strokeWidth={0.6} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Sparkles, title: "Matched to you", body: "Each box reflects your latest protocol and cognitive profile." },
          { icon: Package, title: "Branded boxes", body: "AQLA Labs packaging, labelled by formula family and cycle." },
          { icon: Truck, title: "Doorstep delivery", body: "Shipped on your protocol cadence so you never run out." },
        ].map((f) => (
          <div key={f.title} className="aqla-panel rounded-2xl p-5">
            <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <p className="mt-3 font-display text-sm text-foreground">{f.title}</p>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>

      {/* ── Experiments Section ── */}
      <div className="mt-14 flex items-center gap-2.5">
        <FlaskConical className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Personal experiments</p>
      </div>
      <h2 className="mt-2 text-2xl md:text-3xl font-light text-foreground">N-of-1 experiments</h2>
      <p className="mt-3 text-sm text-muted-foreground max-w-xl">AQLA never assumes an intervention works. It measures your personal response.</p>

      {!experiments ? (
        <div className="mt-8 text-sm text-muted-foreground">Loading experiments…</div>
      ) : !experiments.length ? (
        <div className="mt-8 text-center py-16">
          <FlaskConical className="w-7 h-7 text-primary mx-auto" strokeWidth={1.5} />
          <p className="mt-4 text-sm text-muted-foreground">You have not tested an intervention yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Once AQLA has enough baseline data, it will help you run a controlled personal experiment.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {experiments.map((e) => (
            <div key={e.id} className="aqla-panel rounded-3xl p-8">
              <div className="flex items-center gap-3 flex-wrap">
                {PHASES.map((p, i) => (
                  <React.Fragment key={p}>
                    <span className={`text-[11px] uppercase tracking-widest ${PHASES.indexOf(e.status) >= i ? "text-primary" : "text-muted-foreground/50"}`}>{p}</span>
                    {i < PHASES.length - 1 && <span className="h-px w-6 bg-border" />}
                  </React.Fragment>
                ))}
              </div>
              <h3 className="mt-5 font-display text-xl text-foreground leading-snug">{e.hypothesis}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Intervention: {e.intervention}</p>

              {e.measurements?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {e.measurements.map((m) => <span key={m} className="px-3 py-1.5 rounded-full border border-border text-[11px] text-muted-foreground">{m}</span>)}
                </div>
              )}

              {e.results?.length > 0 && (
                <div className="mt-6 border-t border-border/40 pt-5 space-y-2.5">
                  {e.results.map((r) => (
                    <div key={r.metric} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{r.metric}</span>
                      <span className="tabular-nums font-medium" style={{ color: r.direction === "positive" ? "#C9F24E" : r.direction === "negative" ? "#E8A28F" : "#8b8578" }}>
                        {r.change}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs text-muted-foreground">
                {e.confidence && <span>Confidence: <span className="text-foreground">{CONF[e.confidence]}</span></span>}
                {e.adherence != null && <span>Adherence: <span className="text-foreground tabular-nums">{e.adherence}%</span></span>}
                {e.duration_days && <span>Duration: <span className="text-foreground tabular-nums">{e.duration_days} days</span></span>}
              </div>
              {e.decision && (
                <p className="mt-4 text-sm text-foreground/90 border-l-2 border-primary/50 pl-4">{e.decision}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}