import React from "react";
import { PROTOCOL_DETAILS } from "@/lib/protocolDetails";

export default function ProtocolHoverCard({ protocol }) {
  const details = PROTOCOL_DETAILS[protocol.key];

  return (
    <div tabIndex={0} className="group relative rounded-2xl border border-border/50 bg-background/60 p-6 transition-colors hover:border-border focus:border-border focus:outline-none">
      <div className="mb-5 h-2 w-2 rounded-full" style={{ background: protocol.color }} />
      <p className="font-display font-semibold tracking-wide text-foreground">{protocol.name}</p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{protocol.purpose}</p>

      <div className="invisible absolute bottom-[calc(100%+12px)] left-1/2 z-30 w-72 -translate-x-1/2 rounded-2xl border border-border bg-background/95 p-5 opacity-0 shadow-2xl backdrop-blur-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100">
        <p className="text-xs uppercase tracking-widest" style={{ color: protocol.color }}>Formulation</p>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">{details.formulation}</p>
        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Benefits</p>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">{details.benefits.join(" · ")}</p>
        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Ingredients</p>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">{details.ingredients.join(" · ")}</p>
      </div>
    </div>
  );
}