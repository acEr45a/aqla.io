import React from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  fontSize: "12px",
};

const SERIES = [
  { key: "writes", name: "Data writes", color: "hsl(var(--chart-1))" },
  { key: "emailJobs", name: "Email jobs", color: "hsl(var(--chart-2))" },
  { key: "aiTasks", name: "AI tasks", color: "hsl(var(--chart-3))" },
  { key: "securityEvents", name: "Security events", color: "hsl(var(--chart-4))" },
];

export default function OpsActivityChart({ days }) {
  return (
    <div className="aqla-panel rounded-2xl p-5">
      <p className="font-display text-foreground">Backend activity</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Operations volume across the last 14 days.</p>
      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`ops-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {SERIES.map((s) => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color}
                fill={`url(#ops-${s.key})`} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}