import React from "react";
import { Link } from "react-router-dom";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";
import ProtocolHoverCard from "@/components/landing/ProtocolHoverCard";
import { Shield, FlaskConical, ArrowRight } from "lucide-react";

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
      {/* Problem */}
      <section className="max-w-4xl mx-auto px-6 py-28">
        <p className="text-sm text-muted-foreground tracking-widest uppercase mb-6">The problem</p>
        <h2 className="text-3xl md:text-5xl font-light leading-tight text-foreground">
          Most people try random supplements, productivity hacks, and wellness habits —{" "}
          <span className="text-muted-foreground">without ever knowing their real bottleneck.</span>
        </h2>
      </section>

      {/* How it works */}
      <section id="science" className="border-y border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-sm text-muted-foreground tracking-widest uppercase mb-12">How AQLA works</p>
          <div className="grid md:grid-cols-5 gap-px bg-border/40">
            {LOOP.map((step, i) => (
              <div key={i} className="bg-background p-6 md:p-8">
                <span className="font-display text-3xl text-primary/70 tabular-nums">0{i + 1}</span>
                <p className="mt-4 text-sm text-foreground/90 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiments */}
      <section className="max-w-6xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-sm text-muted-foreground tracking-widest uppercase mb-6">Personal experiments</p>
          <h2 className="text-3xl md:text-4xl font-light text-foreground leading-tight">
            AQLA never assumes a recommendation works.
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Every intervention becomes a controlled personal experiment — baseline, intervention, and honest analysis
            of your own response. Correlation is never presented as fact.
          </p>
        </div>
        <div className="aqla-panel rounded-2xl p-8">
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

      {/* Five protocols */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <p className="text-sm text-muted-foreground tracking-widest uppercase mb-3">Five protocols</p>
          <h2 className="text-3xl font-light text-foreground mb-12">Cognitive-performance protocols — not powders.</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {PROTOCOL_FAMILIES.map((protocol) => (
              <ProtocolHoverCard key={protocol.key} protocol={protocol} />
            ))}
          </div>
        </div>
      </section>

      {/* Science & safety */}
      <section className="max-w-6xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-12">
        <div className="flex gap-5">
          <FlaskConical className="w-6 h-6 text-primary shrink-0 mt-1" strokeWidth={1.5} />
          <div>
            <h3 className="font-display text-xl text-foreground">The Evidence Passport</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Every ingredient carries a graded evidence record — the type of studies, the populations studied,
              realistic effect sizes, limitations, and interactions. No stars. No fake percentages.
            </p>
          </div>
        </div>
        <div className="flex gap-5">
          <Shield className="w-6 h-6 text-primary shrink-0 mt-1" strokeWidth={1.5} />
          <div>
            <h3 className="font-display text-xl text-foreground">Safety and clinical governance</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              AQLA prioritizes contraindication screening, evidence transparency, and professional review where
              required. It is a wellness platform — it never diagnoses or replaces medical care.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <h2 className="text-4xl md:text-6xl font-light text-foreground leading-tight">
            Stop guessing.<br />Start understanding your brain.
          </h2>
          <Link to="/assessment" className="inline-flex items-center gap-2 mt-10 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
            Build My Brain Map <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 py-10 text-center text-xs text-muted-foreground">
        AQLA is a general wellness and performance platform. It does not diagnose, treat, prevent, or cure any condition.
      </footer>
    </>
  );
}