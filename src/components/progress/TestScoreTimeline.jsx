import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/apiClient";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, ResponsiveContainer, Legend } from "recharts";

const METRICS = [
  { key: "reaction_time", label: "Reaction time", color: "#7B94FF" },
  { key: "sustained_attention", label: "Attention", color: "#C9F24E" },
  { key: "memory_recall", label: "Memory", color: "#E8A28F" },
];

export default function TestScoreTimeline() {
  const [data, setData] = useState(null);
  const [protocols, setProtocols] = useState([]);
  const [visible, setVisible] = useState(METRICS.map((m) => m.key));

  useEffect(() => {
    Promise.all([
      apiClient.entities.CognitiveTest.list("-created_date", 200),
      apiClient.entities.Protocol.list("-created_date", 10),
    ]).then(([tests, prots]) => {
      const byDate = {};
      tests.forEach((t) => {
        const date = (t.completed_date || t.created_date || "").slice(0, 10);
        if (!date) return;
        byDate[date] = byDate[date] || { date };
        byDate[date][t.test_type] = Math.round(t.normalized_score);
      });
      setData(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
      setProtocols(prots.filter((p) => p.start_date));
    });
  }, []);

  const toggle = (key) =>
    setVisible((v) => (v.includes(key) ? v.filter((k) => k !== key) : [...v, key]));

  const inRange = (d) => data?.some((row) => row.date >= d);

  return (
    <section className="mt-8 aqla-panel rounded-3xl p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-foreground mb-1">Cognitive test scores over time</h2>
          <p className="text-xs text-muted-foreground">Measured performance per session. Shaded bands mark protocol periods.</p>
        </div>
        <div className="flex gap-2">
          {METRICS.map((m) => (
            <button key={m.key} onClick={() => toggle(m.key)}
              className={`px-3 py-1.5 rounded-full border text-[11px] transition-all ${
                visible.includes(m.key) ? "border-transparent text-background font-medium" : "border-border text-muted-foreground"}`}
              style={visible.includes(m.key) ? { background: m.color } : {}}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {data === null ? (
        <div className="h-56 mt-6 animate-pulse bg-secondary/40 rounded-xl" />
      ) : data.length < 2 ? (
        <div className="h-40 mt-4 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm text-muted-foreground max-w-sm">
            AQLA needs at least two test sessions to show a trend. Repeat your baseline to start tracking shifts.
          </p>
          <Link to="/tests" className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">Run Tests</Link>
        </div>
      ) : (
        <div className="h-72 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10 }}>
              {protocols.map((p) =>
                inRange(p.start_date) ? (
                  <ReferenceArea key={p.id} x1={p.start_date} x2={p.review_date || undefined}
                    fill="#8FE8C2" fillOpacity={0.05} stroke="#8FE8C2" strokeOpacity={0.2} strokeDasharray="3 4"
                    label={{ value: p.family, position: "insideTopRight", fill: "#8FE8C2", fontSize: 10, opacity: 0.8 }} />
                ) : null
              )}
              <XAxis dataKey="date" stroke="#6b6559" fontSize={11} tickLine={false} axisLine={false}
                tickFormatter={(d) => d.slice(5)} />
              <YAxis domain={[0, 100]} stroke="#6b6559" fontSize={11} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ background: "hsl(26 11% 10%)", border: "1px solid hsl(30 9% 18%)", borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
              {METRICS.filter((m) => visible.includes(m.key)).map((m) => (
                <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color}
                  strokeWidth={1.75} dot={{ r: 3, fill: m.color }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {data && data.length >= 2 && (
        <p className="mt-4 text-[11px] text-muted-foreground">
          Shifts during a protocol period are observations, not proven effects — repeat sessions improve confidence.
        </p>
      )}
    </section>
  );
}