import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { FlaskConical } from "lucide-react";

const CONF = {
  too_early: "Too early to tell", possible_benefit: "Possible benefit", likely_benefit: "Likely benefit",
  no_clear_effect: "No clear effect", possible_negative: "Possible negative effect", likely_negative: "Likely negative effect",
};

const PHASES = ["baseline", "intervention", "analysis", "complete"];

export default function Experiments() {
  const [experiments, setExperiments] = useState(null);

  useEffect(() => {
    apiClient.entities.Experiment.list("-created_date").then(setExperiments);
  }, []);

  if (!experiments) return <div className="p-10 text-sm text-muted-foreground">Loading experiments…</div>;

  if (!experiments.length) {
    return (
      <div className="max-w-lg mx-auto px-6 py-32 text-center">
        <FlaskConical className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
        <h1 className="mt-6 text-2xl font-light text-foreground">You have not tested an intervention yet.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Once AQLA has enough baseline data, it will help you run a controlled personal experiment.</p>
        <Link to="/today" className="inline-block mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-medium text-sm">Continue Baseline</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">Personal experiments</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">N-of-1 experiments</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-xl">AQLA never assumes an intervention works. It measures your personal response.</p>

      <div className="mt-10 space-y-6">
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
            <h2 className="mt-5 font-display text-xl text-foreground leading-snug">{e.hypothesis}</h2>
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
    </div>
  );
}