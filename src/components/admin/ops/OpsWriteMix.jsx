import React from "react";

export default function OpsWriteMix({ writeMix, checklist }) {
  const max = Math.max(...writeMix.map((item) => item.count), 1);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="aqla-panel rounded-2xl p-5">
        <p className="font-display text-foreground">Where the writes come from</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Records created by member activity.</p>
        <div className="mt-5 space-y-2.5">
          {writeMix.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">{item.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-foreground tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="aqla-panel rounded-2xl p-5">
        <p className="font-display text-foreground">Development queue</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Checklist state maintained by the ops agent.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { label: "Open", value: checklist.open },
            { label: "In progress", value: checklist.inProgress },
            { label: "Done", value: checklist.done },
            { label: "Wordbank ideas", value: checklist.wordbankUnused },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-display text-xl text-foreground tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}