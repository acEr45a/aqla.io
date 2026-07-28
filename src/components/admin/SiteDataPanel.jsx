import React from "react";
import { Database } from "lucide-react";

export default function SiteDataPanel({ siteData, days }) {
  const busiest = [...days].sort((a, b) => (b.checkIns + b.tests + b.games) - (a.checkIns + a.tests + a.games))[0];
  const max = Math.max(...siteData.inventory.map((item) => item.count), 1);

  return (
    <section className="space-y-5">
      <div className="aqla-panel rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <p className="font-display text-foreground">Record inventory</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {siteData.dataPoints} records stored across the platform{busiest ? ` · busiest day ${busiest.label}` : ""}.
        </p>
        <div className="mt-5 space-y-2.5">
          {siteData.inventory.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-xs text-muted-foreground">{item.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary/60" style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-foreground tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="aqla-panel rounded-2xl p-5">
        <p className="font-display text-foreground">Safety eligibility mix</p>
        {siteData.eligibility.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No safety screenings completed yet.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {siteData.eligibility.map((item) => (
              <span key={item.name} className="rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground">
                {item.name.replace(/_/g, " ")} · <span className="text-foreground tabular-nums">{item.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}