import React from "react";
import { Smartphone, Monitor, Tablet, Globe } from "lucide-react";

const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

function BarRow({ label, value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export default function VisitBreakdown({ visits }) {
  const devices = visits?.devices || [];
  const browsers = visits?.browsers || [];
  const referrers = visits?.referrers || [];
  const deviceTotal = devices.reduce((s, d) => s + d.count, 0);
  const browserTotal = browsers.reduce((s, d) => s + d.count, 0);
  const refTotal = referrers.reduce((s, d) => s + d.count, 0);

  return (
    <section className="aqla-panel rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <p className="font-display text-foreground">Visit breakdown</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Last 14 days · source, device & browser</p>

      <div className="mt-5 grid gap-6 md:grid-cols-3">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Device</p>
          <div className="flex items-center gap-3">
            {devices.map((d) => {
              const Icon = DEVICE_ICON[d.name] || Monitor;
              return (
                <div key={d.name} className="flex flex-col items-center gap-1 rounded-xl bg-secondary/50 px-3 py-2.5 w-20">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground tabular-nums">{d.count}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{d.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Browser</p>
          <div className="space-y-2.5">
            {browsers.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
            {browsers.map((b) => <BarRow key={b.name} label={b.name} value={b.count} total={browserTotal} />)}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Source</p>
          <div className="space-y-2.5">
            {referrers.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
            {referrers.map((r) => <BarRow key={r.name} label={r.name} value={r.count} total={refTotal} />)}
          </div>
        </div>
      </div>
    </section>
  );
}