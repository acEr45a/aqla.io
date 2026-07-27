import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { DOMAINS } from "@/lib/scoring";
import RadialMap from "@/components/brainmap/RadialMap";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

const TrendIcon = ({ trend }) =>
  trend === "up" ? <TrendingUp className="w-4 h-4 text-[#C9F24E]" /> :
  trend === "down" ? <TrendingDown className="w-4 h-4 text-[#E8A28F]" /> :
  <Minus className="w-4 h-4 text-muted-foreground" />;

export default function BrainMap() {
  const [records, setRecords] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    base44.entities.BrainDomain.list("-updated_date").then((rows) => {
      const latest = {};
      rows.forEach((r) => { if (!latest[r.domain_key]) latest[r.domain_key] = r; });
      setRecords(latest);
    });
  }, []);

  if (!records) return <div className="p-10 text-muted-foreground text-sm">Loading your map…</div>;

  const domains = DOMAINS.filter((d) => records[d.key]).map((d) => ({ ...d, score: Math.round(records[d.key].score), record: records[d.key] }));

  if (!domains.length) {
    return (
      <div className="max-w-lg mx-auto px-6 py-32 text-center">
        <h1 className="text-2xl font-light text-foreground">Your Brain Health Map hasn't been built yet.</h1>
        <p className="mt-3 text-muted-foreground text-sm">Complete the onboarding assessment and AQLA will construct your first map.</p>
        <Link to="/assessment" className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-medium">
          Start Assessment <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const sel = selected || domains.reduce((a, b) => (a.score < b.score ? a : b));
  const r = sel.record;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">Brain Health Map</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">Your current profile</h1>
      <div className="mt-10 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-start">
        <div className="lg:sticky lg:top-10">
          <RadialMap domains={domains} size={440} onSelect={(d) => { setSelected(d); setShowWhy(false); }} selectedKey={sel.key} />
          <p className="mt-3 text-xs text-muted-foreground text-center">Select a domain to inspect it.</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={sel.key} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.35 }}
            className="aqla-panel rounded-3xl p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: sel.color }}>{sel.label}</p>
                <p className="mt-2 font-display text-5xl font-light text-foreground tabular-nums">
                  {sel.score}<span className="text-lg text-muted-foreground"> / 100</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendIcon trend={r.trend} /> {r.confidence} confidence
              </div>
            </div>

            <p className="mt-5 text-sm text-muted-foreground leading-relaxed">{r.summary}</p>

            {r.limiting_factors?.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Limiting factors</p>
                {r.limiting_factors.map((f) => (
                  <p key={f} className="text-sm text-foreground/90 py-1.5 border-b border-border/40 flex gap-2">
                    <span className="text-[#F2C04E]">—</span>{f}
                  </p>
                ))}
              </div>
            )}
            {r.protective_factors?.length > 0 && (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Protective factors</p>
                {r.protective_factors.map((f) => (
                  <p key={f} className="text-sm text-foreground/90 py-1.5 border-b border-border/40 flex gap-2">
                    <span className="text-primary">+</span>{f}
                  </p>
                ))}
              </div>
            )}

            {r.next_action && (
              <div className="mt-6 rounded-xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Recommended next action</p>
                <p className="mt-1.5 text-sm text-foreground">{r.next_action}</p>
              </div>
            )}

            <button onClick={() => setShowWhy(!showWhy)} className="mt-6 text-sm text-primary hover:underline">
              Why this score?
            </button>
            {showWhy && (
              <div className="mt-3 text-xs text-muted-foreground leading-relaxed space-y-2">
                <p><span className="text-foreground">Data sources:</span> {(r.data_sources || []).join(", ") || "Onboarding assessment"}.</p>
                <p><span className="text-foreground">User-reported:</span> your assessment answers on this domain's habits and experience.</p>
                <p><span className="text-foreground">AQLA interpretation:</span> a weighted composite of contributing factors, shown without technical weightings.</p>
                <p><span className="text-foreground">Unknowns:</span> no cognitive test or wearable data yet — confidence will rise as observations accumulate.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}