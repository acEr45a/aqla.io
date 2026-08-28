import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { DOMAINS, primaryBottleneck } from "@/lib/scoring";
import { PROTOCOL_FAMILIES, protocolFit } from "@/lib/protocols";
import EligibilityGate from "@/components/protocols/EligibilityGate";
import { Check, Minus, AlertTriangle } from "lucide-react";

const STATUS_STYLE = {
  "Recommended": { icon: Check, cls: "text-[#C9F24E] border-[#C9F24E]/30 bg-[#C9F24E]/8" },
  "Potentially suitable": { icon: Minus, cls: "text-[#5FD4E8] border-[#5FD4E8]/30 bg-[#5FD4E8]/8" },
  "Not currently recommended": { icon: AlertTriangle, cls: "text-[#F2C04E] border-[#F2C04E]/30 bg-[#F2C04E]/8" },
};

export default function Protocols() {
  const [bottleneck, setBottleneck] = useState(null);

  useEffect(() => {
    apiClient.entities.BrainDomain.list("-updated_date").then((rows) => {
      if (!rows.length) return;
      const latest = {};
      rows.forEach((r) => { if (!latest[r.domain_key]) latest[r.domain_key] = r; });
      const domains = DOMAINS.filter((d) => latest[d.key]).map((d) => ({ ...d, score: latest[d.key].score }));
      if (domains.length) setBottleneck(primaryBottleneck(domains));
    });
  }, []);

  const fits = protocolFit(bottleneck?.key);
  const ordered = [...PROTOCOL_FAMILIES].sort((a, b) => {
    const rank = (s) => (s === "Recommended" ? 0 : s === "Potentially suitable" ? 1 : 2);
    return rank(fits[a.key].status) - rank(fits[b.key].status);
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">Protocol selector</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">Five protocol families</h1>
      <p className="mt-3 text-muted-foreground max-w-xl text-sm leading-relaxed">
        These are evidence-informed protocol categories, not prescriptions. Every recommendation is subject to safety
        screening — and AQLA will recommend <span className="text-foreground">no supplement at all</span> when a behavioral
        change addresses the primary cause.
      </p>
      {bottleneck && (
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-xs text-muted-foreground">
          Your current bottleneck: <span style={{ color: bottleneck.color }}>{bottleneck.label}</span>
        </div>
      )}

      <EligibilityGate />

      <div className="mt-10 space-y-4">
        {ordered.map((p) => {
          const fit = fits[p.key];
          const S = STATUS_STYLE[fit.status];
          return (
            <div key={p.key} className="aqla-panel rounded-3xl p-7 md:p-8 grid md:grid-cols-[180px_1fr] gap-6">
              <div>
                <div className="w-2.5 h-2.5 rounded-full mb-4" style={{ background: p.color }} />
                <p className="font-display text-2xl tracking-wide text-foreground">{p.name}</p>
                <p className="mt-2 text-xs text-muted-foreground">Evidence: {p.evidence}</p>
                <span className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] ${S.cls}`}>
                  <S.icon className="w-3 h-3" /> {fit.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-foreground leading-relaxed">{p.purpose}</p>
                <p className="mt-2 text-xs text-muted-foreground">{p.direction}</p>
                <div className="mt-4 rounded-xl bg-secondary/50 p-4">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
                    {fit.status === "Recommended" ? "Why recommended" : fit.status === "Potentially suitable" ? "When it may fit" : "Why not selected"}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{fit.reason}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}