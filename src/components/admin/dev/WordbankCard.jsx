import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import IdeaDetailPopover from "./IdeaDetailPopover";
import { TIER_META } from "./devTiers";

export default function WordbankCard({ idea, onAdd, onDelete, adding }) {
  const [open, setOpen] = useState(false);
  const meta = TIER_META[idea.tier] || TIER_META.feature;
  return (
    <>
      <div className="group relative rounded-2xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-foreground/25">
        <div className="flex items-center gap-2">
          <span className="rounded-full border px-2 py-0.5 text-[10px]"
            style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}10` }}>
            {meta.label}
          </span>
          {idea.area && <span className="truncate text-[11px] text-muted-foreground">{idea.area}</span>}
          <button onClick={() => onDelete(idea)} className="ml-auto text-muted-foreground hover:text-destructive" title="Remove">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="cursor-pointer" onClick={() => setOpen(true)}>
          <p className="mt-2 text-sm text-foreground">{idea.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{idea.summary}</p>
        </div>
        <button onClick={() => onAdd(idea)} disabled={adding || idea.used}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-foreground/30 disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" /> {idea.used ? "In checklist" : "Add to checklist"}
        </button>
      </div>
      <IdeaDetailPopover idea={idea} variant="wordbank" open={open} onOpenChange={setOpen} />
    </>
  );
}