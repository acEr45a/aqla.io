import React, { useState } from "react";
import { ChevronDown, FileDown } from "lucide-react";

const FAMILY_COLORS = { SPARK: "#C9F24E", FLOW: "#5FD4E8", DRIVE: "#7B94FF", LEARN: "#E8A28F", RESET: "#8FE8C2", DIGITAL: "#B89CF6" };

export default function PlanHistoryCard({ protocol, onDownload, downloadDisabled, disabledReason }) {
  const [open, setOpen] = useState(false);
  const color = FAMILY_COLORS[protocol.family] || "#C9F24E";

  return (
    <div className="aqla-panel rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{protocol.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {protocol.family} · {protocol.start_date || "—"} · {protocol.duration_days || 14} days ·{" "}
            <span className={protocol.status === "active" ? "text-primary" : ""}>{protocol.status}</span>
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border/50 text-sm">
          <p className="text-muted-foreground leading-relaxed">{protocol.objective}</p>
          {protocol.why_selected && (
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed"><span className="text-foreground">Why selected:</span> {protocol.why_selected}</p>
          )}
          {protocol.actions?.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {protocol.actions.map((a, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span style={{ color }}>{i + 1}.</span>
                  <span><span className="text-foreground/90">{a.title}</span>{a.time ? ` · ${a.time}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
          <button onClick={onDownload} disabled={downloadDisabled}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border hover:border-foreground/30 transition-colors text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border">
            <FileDown className="w-3.5 h-3.5" /> Download full cycle report (PDF)
          </button>
          {downloadDisabled && disabledReason && (
            <p className="mt-2 text-[11px] text-[#F2C04E]">⚠️ {disabledReason}</p>
          )}
        </div>
      )}
    </div>
  );
}