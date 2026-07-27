import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const INSIGHTS = [
  { text: "Your strongest focus days follow consistent wake times.", conf: "moderate confidence" },
  { text: "Caffeine after 2:00 PM is associated with lower next-morning readiness.", conf: "moderate confidence" },
  { text: "Exercise appears to improve your afternoon mental energy.", conf: "possible — correlation only" },
  { text: "Your current data is insufficient to evaluate LEARN.", conf: "not enough data" },
];

const HABITS = [
  { habit: "Consistent wake time", impact: 82 },
  { habit: "Morning outdoor light", impact: 68 },
  { habit: "Caffeine cutoff before noon", impact: 61 },
  { habit: "Hydration before 10 AM", impact: 44 },
  { habit: "Evening screen reduction", impact: 37 },
];

export default function Progress() {
  const [checkIns, setCheckIns] = useState(null);

  useEffect(() => {
    base44.entities.DailyCheckIn.list("-date", 30).then((rows) => setCheckIns([...rows].reverse()));
  }, []);

  const data = (checkIns || []).map((c) => ({
    date: c.date?.slice(5), clarity: c.clarity, energy: c.energy, sleep: c.sleep_quality,
  }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">Progress & insights</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">Your signal landscape</h1>

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

      <section className="mt-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-lg text-foreground mb-5">Insights</h2>
          <div className="space-y-5">
            {INSIGHTS.map((ins) => (
              <div key={ins.text} className="border-l-2 border-primary/40 pl-4">
                <p className="text-sm text-foreground/90 leading-relaxed">{ins.text}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{ins.conf}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-muted-foreground">
            AQLA distinguishes correlation from causation — insights are observations, not proven effects.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg text-foreground mb-5">Habit impact ranking</h2>
          <div className="space-y-4">
            {HABITS.map((h) => (
              <div key={h.habit}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{h.habit}</span>
                  <span className="text-foreground tabular-nums text-xs">{h.impact}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70 transition-all duration-700" style={{ width: `${h.impact}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}