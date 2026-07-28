import React from "react";
import { PROTOCOL_DETAILS } from "@/lib/protocolDetails";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";

export default function ProtocolPlanCard({ plan }) {
  const family = PROTOCOL_FAMILIES.find((item) => item.key === plan.family);
  const details = PROTOCOL_DETAILS[plan.family];

  return (
    <article className="aqla-panel rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: family?.color }} />
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{plan.family}</p>
      </div>
      <h3 className="mt-4 font-display text-lg text-foreground">{plan.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.objective}</p>
      <div className="mt-5 border-t border-border/50 pt-4 text-xs leading-relaxed text-muted-foreground">
        <p><span className="text-foreground">Formulation:</span> {details?.formulation}</p>
        <p className="mt-2"><span className="text-foreground">Ingredients:</span> {details?.ingredients.join(" · ")}</p>
        <p className="mt-2"><span className="text-foreground">Benefits:</span> {plan.expected_benefits?.join(" · ")}</p>
      </div>
    </article>
  );
}