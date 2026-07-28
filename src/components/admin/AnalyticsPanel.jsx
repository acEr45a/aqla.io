import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" };

const Metric = ({ label, value, suffix }) => (
  <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-lg text-foreground tabular-nums">{value}{suffix}</p>
  </div>
);

export default function AnalyticsPanel({ analytics }) {
  const { funnel, testTypes, domainAverages, engagement } = analytics;

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Check-ins / user" value={engagement.avgCheckInsPerUser} suffix="" />
        <Metric label="Tests / user" value={engagement.avgTestsPerUser} suffix="" />
        <Metric label="Training sessions" value={engagement.gameSessions} suffix="" />
        <Metric label="Plan reviews" value={engagement.planReviews} suffix="" />
        <Metric label="Switch rate" value={engagement.switchRate} suffix="%" />
      </div>

      <div className="aqla-panel rounded-2xl p-5">
        <p className="font-display text-foreground">Activation funnel</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Where members progress or drop off after signing up.</p>
        <div className="mt-5 space-y-3">
          {funnel.map((step) => (
            <div key={step.stage}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-foreground">{step.stage}</span>
                <span className="text-muted-foreground tabular-nums">{step.value} · {step.share}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${step.share}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="aqla-panel rounded-2xl p-5">
          <p className="font-display text-foreground">Average test scores</p>
          {testTypes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No cognitive tests completed yet.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={testTypes} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="average" name="Avg score" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="aqla-panel rounded-2xl p-5">
          <p className="font-display text-foreground">Brain domain averages</p>
          {domainAverages.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No brain maps generated yet.</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {domainAverages.map((domain) => (
                <div key={domain.name} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-xs text-muted-foreground">{domain.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-chart-2" style={{ width: `${domain.average}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs text-foreground tabular-nums">{domain.average}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}