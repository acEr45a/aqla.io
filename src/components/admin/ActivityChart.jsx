import React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ActivityChart({ data }) {
  return (
    <section className="aqla-panel rounded-2xl p-5">
      <p className="font-display text-foreground">Daily activity</p>
      <p className="mt-1 text-xs text-muted-foreground">Check-ins and completed tests</p>
      <div className="mt-5 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}><XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" /><YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} width={25} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} /><Bar dataKey="checkIns" fill="hsl(var(--chart-2))" radius={[5, 5, 0, 0]} /><Bar dataKey="tests" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}