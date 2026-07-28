import React from "react";
import { ChevronDown } from "lucide-react";
import EvidencePassport, { GradeBadge } from "@/components/science/EvidencePassport";

export default function EvidenceEntry({ item, open, onToggle }) {
  return (
    <article className="aqla-panel rounded-2xl p-5">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 text-left">
        <div>
          <h3 className="text-sm font-medium text-foreground">{item.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{item.role}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <GradeBadge grade={item.evidence_grade} />
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && <EvidencePassport ingredient={item} />}
    </article>
  );
}