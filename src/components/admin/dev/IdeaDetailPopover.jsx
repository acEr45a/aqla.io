import React from "react";
import { TIER_META } from "./devTiers";

/* Hover detail card — richer for wordbank ideas, tighter for checklist items.
   Uses pt-2 (not mt-2) so the gap stays inside the hovered element — no flicker. */
export default function IdeaDetailPopover({ idea, variant = "checklist" }) {
  const meta = TIER_META[idea.tier] || TIER_META.feature;
  return (
    <div className="pointer-events-none absolute left-0 top-full z-30 hidden w-[min(30rem,85vw)] pt-2 group-hover:block">
      <div className="rounded-2xl border border-border bg-popover p-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
          <span className="text-[11px] uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
          {idea.area && <span className="text-[11px] text-muted-foreground">· {idea.area}</span>}
          {variant === "wordbank" && <span className="ml-auto text-[11px] text-muted-foreground">Deep detail</span>}
        </div>
        <p className="mt-2 text-sm text-foreground">{idea.title}</p>
        {idea.detail && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{idea.detail}</p>}

        {(idea.impact || idea.effort) && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {idea.impact && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Impact</p>
                <p className="mt-0.5 text-xs text-foreground/90">{idea.impact}</p>
              </div>
            )}
            {idea.effort && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Effort</p>
                <p className="mt-0.5 text-xs text-foreground/90">{idea.effort}</p>
              </div>
            )}
          </div>
        )}

        {idea.steps?.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Steps</p>
            <ol className="mt-1 space-y-1">
              {idea.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span style={{ color: meta.color }}>{i + 1}.</span>{s}
                </li>
              ))}
            </ol>
          </div>
        )}

        {idea.raw_input && (
          <p className="mt-3 border-t border-border/60 pt-2 text-[11px] italic text-muted-foreground">You said: "{idea.raw_input}"</p>
        )}
      </div>
    </div>
  );
}