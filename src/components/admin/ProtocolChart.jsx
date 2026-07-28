import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ProtocolChart({ data }) {
  return (
    <section className="aqla-panel rounded-2xl p-5">
      <p className="font-display text-foreground">Active protocol mix</p>
      <p className="mt-1 text-xs text-muted-foreground">Current plans by family</p>
      <div className="mt-3 flex h-60 items-center">
        {data.length ? <ResponsiveContainer width="62%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={4}>{data.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} /></PieChart></ResponsiveContainer> : <p className="text-sm text-muted-foreground">No active protocols yet.</p>}
        <div className="space-y-2 text-xs">{data.map((item, index) => <p key={item.name} className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{item.name} <span className="text-foreground">{item.value}</span></p>)}</div>
      </div>
    </section>
  );
}