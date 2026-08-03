import React, { useState } from "react";
import { Check, Trash2, Circle, Loader2 } from "lucide-react";
import IdeaDetailPopover from "./IdeaDetailPopover";
import { TIER_META } from "./devTiers";

const NEXT = { open: "in_progress", in_progress: "done", done: "open" };

export default function ChecklistRow({ idea, onCycleStatus, onDelete }) {
  const [open, setOpen] = useState(false);
  const meta = TIER_META[idea.tier] || TIER_META.feature;
  const done = idea.status === "done";
  return (
    <>
      <div className="group relative flex items-start gap-3 bg-card/60 px-4 py-3.5">
        <button onClick={() => onCycleStatus(idea, NEXT[idea.status] || "in_progress")}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground" title="Cycle status">
          {done ? <Check className="h-4 w-4 text-primary" />
            : idea.status === "in_progress" ? <Loader2 className="h-4 w-4 text-[#F2C04E]" />
            : <Circle className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setOpen(true)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-2 py-0.5 text-[10px]"
              style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}10` }}>
              {meta.label}
            </span>
            <p className={`text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{idea.title}</p>
          </div>
          {idea.summary && <p className="mt-1 text-xs text-muted-foreground">{idea.summary}</p>}
        </div>
        <button onClick={() => onDelete(idea)} className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive" title="Remove">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <IdeaDetailPopover idea={idea} open={open} onOpenChange={setOpen} />
    </>
  );
}