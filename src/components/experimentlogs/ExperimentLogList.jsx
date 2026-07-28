import React from "react";
import { base44 } from "@/api/base44Client";
import { Trash2 } from "lucide-react";

const EFFECT = {
  better: { label: "Better", color: "#C9F24E" },
  same: { label: "No clear change", color: "#8b8578" },
  worse: { label: "Worse", color: "#E8A28F" },
};

export default function ExperimentLogList({ logs, onChanged }) {
  if (!logs.length) {
    return <p className="mt-8 text-sm text-muted-foreground">No entries yet. Log a variable above and AQLA will start pairing it with your daily check-ins.</p>;
  }

  const remove = async (id) => {
    await base44.entities.ExperimentLog.delete(id);
    onChanged?.();
  };

  return (
    <div className="mt-8 space-y-3">
      {logs.map((log) => {
        const effect = EFFECT[log.perceived_effect] || EFFECT.same;
        return (
          <div key={log.id} className="aqla-panel rounded-2xl px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-foreground">{log.variable}{log.detail ? ` — ${log.detail}` : ""}</p>
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {log.date}{log.timing ? ` · ${log.timing}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px]" style={{ color: effect.color }}>{effect.label}</span>
                <button type="button" onClick={() => remove(log.id)} aria-label="Delete entry"
                  className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {log.note && <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">{log.note}</p>}
          </div>
        );
      })}
    </div>
  );
}