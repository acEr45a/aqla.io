import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, ArrowLeft, ShieldCheck } from "lucide-react";
import ComparisonBar from "@/components/community/ComparisonBar";

export default function CommunityInsights() {
  const [data, setData] = useState(null);

  useEffect(() => {
    base44.functions.invoke("getCommunityInsights", {}).then((res) => setData(res.data));
  }, []);

  if (!data) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Aggregating community signals…</div>;
  }

  const totalFamilies = (data.families || []).reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/progress" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to progress
      </Link>
      <div className="mt-4 flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Users className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Community insights</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-light text-foreground">How you compare</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Anonymised, aggregated trends from {data.members} AQLA members — {data.contributors} active in the {data.window}. No individual data is ever shown.
          </p>
        </div>
      </div>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Members", value: data.members },
          { label: "Active (30d)", value: data.contributors },
          { label: "Your check-ins", value: data.consistency.you },
          { label: "Community avg", value: data.consistency.communityAverage },
        ].map((item) => (
          <div key={item.label} className="aqla-panel rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className="mt-1.5 text-xl sm:text-2xl font-light text-foreground tabular-nums">{item.value}</p>
          </div>
        ))}
      </section>

      {data.consistency.percentile != null && (
        <p className="mt-4 text-sm text-muted-foreground">
          Your check-in consistency sits in the <span className="text-foreground">top {Math.max(1, 100 - data.consistency.percentile)}%</span> of active members.
        </p>
      )}

      <section className="mt-8 aqla-panel rounded-3xl p-5 sm:p-8">
        <h2 className="font-display text-lg text-foreground">Daily signals</h2>
        <p className="mt-1 text-xs text-muted-foreground">Your 30-day average (bright) against the community average (grey). Lower is better for stress.</p>
        <div className="mt-6 space-y-5">
          {data.signals.map((item) => (
            <ComparisonBar key={item.key} label={item.label} community={item.community} you={item.you} max={10} />
          ))}
        </div>
      </section>

      {data.domainComparison.length > 0 && (
        <section className="mt-6 aqla-panel rounded-3xl p-5 sm:p-8">
          <h2 className="font-display text-lg text-foreground">Cognitive domains</h2>
          <p className="mt-1 text-xs text-muted-foreground">Brain Map scores compared with the member average.</p>
          <div className="mt-6 space-y-5">
            {data.domainComparison.map((item) => (
              <div key={item.name}>
                <ComparisonBar label={item.name} community={item.community} you={item.you} max={100} />
                {item.percentile != null && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">Ahead of {item.percentile}% of members</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.testTypes.length > 0 && (
        <section className="mt-6 aqla-panel rounded-3xl p-5 sm:p-8">
          <h2 className="font-display text-lg text-foreground">Cognitive tests</h2>
          <div className="mt-6 space-y-5">
            {data.testTypes.map((item) => (
              <ComparisonBar key={item.name} label={item.name} community={item.community} you={item.you} max={100} />
            ))}
          </div>
        </section>
      )}

      {totalFamilies > 0 && (
        <section className="mt-6 aqla-panel rounded-3xl p-5 sm:p-8">
          <h2 className="font-display text-lg text-foreground">What members are running</h2>
          <p className="mt-1 text-xs text-muted-foreground">Distribution of active protocol families.</p>
          <div className="mt-5 space-y-3">
            {data.families.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="text-foreground tabular-nums text-xs">{Math.round((item.value / totalFamilies) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${(item.value / totalFamilies) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        All comparisons are computed from aggregated, de-identified data. Group averages are context, not a benchmark you must match — your own trend over time is the meaningful signal.
      </p>
    </div>
  );
}