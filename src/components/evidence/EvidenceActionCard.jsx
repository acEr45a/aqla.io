import React from "react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, BookOpen } from "lucide-react";

const TIER_META = {
  A: { label: "Strong", className: "border-amber-500/40 text-amber-400 bg-amber-500/10" },
  B: { label: "Moderate", className: "border-sky-500/40 text-sky-300 bg-sky-500/10" },
  C: { label: "Emerging", className: "border-violet-500/40 text-violet-300 bg-violet-500/10" },
};

export default function EvidenceActionCard({ action }) {
  const tier = TIER_META[action.evidence_grade] || TIER_META.C;
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{action.category}</p>
          <h3 className="mt-1 font-display text-base text-foreground">{action.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{action.role}</p>
        </div>
        <Badge className={tier.className}>{action.evidence_grade} · {tier.label}</Badge>
      </div>

      <Accordion type="single" collapsible className="mt-2">
        <AccordionItem value="evidence" className="border-b-0">
          <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Evidence &amp; references</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 pt-1">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Studied in</p>
              <p className="text-xs text-foreground/80">{action.studied_population}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Effect size</p>
              <p className="text-xs text-foreground/80">{action.effect_size}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Timeframe</p>
              <p className="text-xs text-foreground/80">{action.timeframe}</p>
            </div>
            {action.references?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">References</p>
                <ul className="space-y-1">
                  {action.references.map((ref) => (
                    <li key={ref} className="flex items-start gap-1.5 text-xs text-foreground/70">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" /> {ref}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}