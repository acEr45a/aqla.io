import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import TestScoreTimeline from "@/components/progress/TestScoreTimeline";

// Rule-based observations derived only from the user's recorded check-ins — no fabricated insights.
function deriveInsights(checkIns) {
  const rows = (checkIns || []).filter((c) => c.valid !== false);
  if (rows.length < 5) return null;
  const avg = (key) => {
    const v = rows.map((c) => c[key]).filter((x) => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const insights = [];
  const clarity = avg("clarity");
  if (clarity != null) {
    insights.push({ text: `Your average mental clarity is ${clarity.toFixed(1)}/10 across ${rows.length} check-ins.`, conf: "observed from your check-ins" });
    const half = Math.floor(rows.length / 2);
    const older = rows.slice(half).map((c) => c.clarity).filter((x) => x != null);
    const recent = rows.slice(0, half).map((c) => c.clarity).filter((x) => x != null);
    if (older.length && recent.length) {
      const diff = recent.reduce((a, b) => a + b, 0) / recent.length - older.reduce((a, b) => a + b, 0) / older.length;
      insights.push({
        text: Math.abs(diff) < 0.5
          ? "Your clarity has been stable over this period."
          : `Your clarity is trending ${diff > 0 ? "up" : "down"} (${diff > 0 ? "+" : ""}${diff.toFixed(1)} recent vs earlier check-ins).`,
        conf: "observed trend — correlation only",
      });
    }
  }
  const stress = avg("stress");
  if (stress != null && stress >= 7) {
    insights.push({ text: `Your average stress is ${stress.toFixed(1)}/10 — currently your most elevated signal.`, conf: "observed from your check-ins" });
  }
  const withCaffeine = rows.filter((c) => c.caffeine_drinks && c.caffeine_drinks.trim() && c.caffeine_drinks.trim().toLowerCase() !== "none");
  if (withCaffeine.length) {
    const times = withCaffeine.map((c) => c.caffeine_last_time).filter((t) => t && t.trim());
    insights.push({
      text: `You logged caffeine on ${withCaffeine.length} of ${rows.length} check-ins${times.length ? `, with your last serving recorded ${times.length} time${times.length > 1 ? "s" : ""} (most recently ${times[0]})` : ""}.`,
      conf: "recorded from your check-ins",
    });
  }
  const sleep = avg("sleep_quality");
  if (sleep != null && sleep < 6) {
    insights.push({ text: `Your average sleep quality is ${sleep.toFixed(1)}/10 — below the 6/10 threshold AQLA watches for recovery.`, conf: "observed from your check-ins" });
  }
  return insights;
}

const SIGNAL_AVERAGES = [
  { key: "clarity", label: "Mental clarity" },
  { key: "energy", label: "Energy" },
  { key: "sleep_quality", label: "Sleep quality" },
  { key: "stress", label: "Stress (lower is better)" },
];

export default function Progress() {
  const [checkIns, setCheckIns] = useState(null);

  useEffect(() => {
    base44.entities.DailyCheckIn.list("-date", 30).then((rows) => setCheckIns([...rows].reverse()));
  }, []);

  const data = (checkIns || []).map((c) => ({
    date: c.date?.slice(5), clarity: c.clarity, energy: c.energy, sleep: c.sleep_quality,
  }));

  const insights = deriveInsights(checkIns);
  const validRows = (checkIns || []).filter((c) => c.valid !== false);
  const signalAverages = validRows.length
    ? SIGNAL_AVERAGES.map((s) => {
        const v = validRows.map((c) => c[s.key]).filter((x) => x != null);
        return v.length ? { ...s, value: v.reduce((a, b) => a + b, 0) / v.length } : null;
      }).filter(Boolean)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">Progress & insights</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">Your signal landscape</h1>

      <Link to="/community-insights"
        className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 p-5 hover:bg-secondary/40 transition-colors">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Users className="h-4 w-4" /></div>
          <div>
            <p className="font-display text-foreground">Community insights</p>
            <p className="mt-0.5 text-xs text-muted-foreground">See how your signals and domain scores compare with anonymised member averages.</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <section className="mt-10 aqla-panel rounded-3xl p-6 md:p-8">
        <h2 className="font-display text-lg text-foreground mb-1">Cognitive signal timeline</h2>
        <p className="text-xs text-muted-foreground mb-6">Mental clarity, energy, and sleep quality from your daily check-ins.</p>
        {checkIns === null ? (
          <div className="h-56 animate-pulse bg-secondary/40 rounded-xl" />
        ) : data.length < 2 ? (
          <div className="h-40 flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground max-w-sm">
              AQLA needs more observations before drawing a reliable conclusion. Two more check-ins will improve confidence.
            </p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  {[["gClarity", "#C9F24E"], ["gEnergy", "#7B94FF"], ["gSleep", "#5FD4E8"]].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="date" stroke="#6b6559" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} stroke="#6b6559" fontSize={11} tickLine={false} axisLine={false} width={24} />
                <Tooltip contentStyle={{ background: "hsl(26 11% 10%)", border: "1px solid hsl(30 9% 18%)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="clarity" name="Clarity" stroke="#C9F24E" fill="url(#gClarity)" strokeWidth={1.75} />
                <Area type="monotone" dataKey="energy" name="Energy" stroke="#7B94FF" fill="url(#gEnergy)" strokeWidth={1.75} />
                <Area type="monotone" dataKey="sleep" name="Sleep" stroke="#5FD4E8" fill="url(#gSleep)" strokeWidth={1.75} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <TestScoreTimeline />

      <section className="mt-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-lg text-foreground mb-5">Insights</h2>
          {insights === null ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              AQLA needs at least 5 valid check-ins before generating insights from your data. Keep checking in daily.
            </p>
          ) : (
            <div className="space-y-5">
              {insights.map((ins) => (
                <div key={ins.text} className="border-l-2 border-primary/40 pl-4">
                  <p className="text-sm text-foreground/90 leading-relaxed">{ins.text}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{ins.conf}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-6 text-[11px] text-muted-foreground">
            Insights are computed only from your recorded check-ins — observations, not proven effects.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-foreground mb-5">Signal averages (30 days)</h2>
          {signalAverages ? (
            <div className="space-y-4">
              {signalAverages.map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="text-foreground tabular-nums text-xs">{s.value.toFixed(1)}/10</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70 transition-all duration-700" style={{ width: `${s.value * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">No check-in data yet — your averages will appear here.</p>
          )}
        </div>
      </section>
    </div>
  );
}