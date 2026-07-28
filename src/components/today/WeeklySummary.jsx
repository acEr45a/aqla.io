import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import { generateWeeklySummary, isEndOfWeek, weekKey } from "@/lib/weeklySummary";

const Row = ({ label, text }) => !text ? null : (
  <div>
    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">{text}</p>
  </div>
);

export default function WeeklySummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEndOfWeek()) return;
    const key = `aqla:weekly:${weekKey()}`;
    const cached = localStorage.getItem(key);
    if (cached) { setSummary(JSON.parse(cached)); return; }
    setLoading(true);
    generateWeeklySummary().then((result) => {
      if (result) { localStorage.setItem(key, JSON.stringify(result)); setSummary(result); }
      setLoading(false);
    });
  }, []);

  if (!isEndOfWeek()) return null;
  if (loading) return <p className="mt-8 text-sm text-muted-foreground">Building your weekly summary…</p>;
  if (!summary) return null;

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="mt-8 aqla-panel rounded-3xl p-8 space-y-5">
      <p className="text-xs uppercase tracking-widest text-primary flex items-center gap-2">
        <CalendarCheck className="w-3.5 h-3.5" /> Weekly summary
      </p>
      <h2 className="font-display text-2xl text-foreground">{summary.headline}</h2>
      <Row label="What AQLA observed" text={summary.observed} />
      <Row label="Pattern in your logs" text={summary.pattern} />
      <Row label="Training" text={summary.training} />
      <Row label="Focus for next week" text={summary.next_week_focus} />
      <div className="flex flex-wrap gap-2 pt-1">
        <span className="px-3 py-1 rounded-full border border-border text-[11px] text-muted-foreground">Confidence: {summary.confidence}</span>
        <span className="px-3 py-1 rounded-full border border-border text-[11px] text-muted-foreground">{summary.check_in_count} check-ins · {summary.session_count} sessions</span>
      </div>
    </motion.section>
  );
}