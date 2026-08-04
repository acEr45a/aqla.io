import React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function SiteVisitsChart({ data }) {
  const total = data.reduce((sum, d) => sum + (d.visits || 0), 0);
  return (
    <section className="aqla-panel rounded-2xl p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-display text-foreground">Site visits</p>
          <p className="mt-1 text-xs text-muted-foreground">Last 14 days · tracked sessions</p>
        </div>
        <p className="text-sm text-foreground tabular-nums">{total}</p>
      </div>
      <div className="mt-5 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
            <Line type="monotone" dataKey="visits" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}