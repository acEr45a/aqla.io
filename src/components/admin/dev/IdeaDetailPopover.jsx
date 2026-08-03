import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TIER_META } from "./devTiers";

/* Click-to-open detail dialog — replaces the old hover popover. */
export default function IdeaDetailPopover({ idea, variant = "checklist", open, onOpenChange }) {
  const meta = TIER_META[idea.tier] || TIER_META.feature;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
            <span className="text-[11px] uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
            {idea.area && <span className="text-[11px] text-muted-foreground">· {idea.area}</span>}
          </DialogTitle>
        </DialogHeader>
        <p className="text-base font-medium text-foreground">{idea.title}</p>
        {idea.summary && <p className="mt-1.5 text-sm text-muted-foreground">{idea.summary}</p>}
        {idea.detail && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{idea.detail}</p>}

        {(idea.impact || idea.effort) && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {idea.impact && (
              <div className="rounded-xl border border-border/60 bg-card/40 p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Impact</p>
                <p className="mt-1 text-xs text-foreground/90">{idea.impact}</p>
              </div>
            )}
            {idea.effort && (
              <div className="rounded-xl border border-border/60 bg-card/40 p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Effort</p>
                <p className="mt-1 text-xs text-foreground/90">{idea.effort}</p>
              </div>
            )}
          </div>
        )}

        {idea.steps?.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Steps</p>
            <ol className="mt-2 space-y-1.5">
              {idea.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span style={{ color: meta.color }}>{i + 1}.</span>{s}
                </li>
              ))}
            </ol>
          </div>
        )}

        {idea.raw_input && (
          <p className="mt-4 border-t border-border/60 pt-3 text-[11px] italic text-muted-foreground">You said: "{idea.raw_input}"</p>
        )}
      </DialogContent>
    </Dialog>
  );
}