import React, { useMemo, useState } from "react";
import { Mail, MailX, ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { Button } from "@/components/ui/button";

const KIND_LABELS = { weekly: "Weekly digest", end_of_plan: "End of plan", manual: "Manual" };

const STATUS_STYLES = {
  delivered: "bg-primary/10 text-primary",
  failed: "bg-destructive/15 text-destructive",
};
const STATUS_LABELS = { delivered: "Delivered", failed: "Failed" };
const FILTERS = [
  { id: "all", label: "All" },
  { id: "delivered", label: "Delivered" },
  { id: "failed", label: "Failed" },
];

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-lg text-foreground tabular-nums">{value}</p>
  </div>
);

export default function EmailLogPanel({ stats, log }) {
  const [order, setOrder] = useState("newest");
  const [filter, setFilter] = useState("all");
  const sortedLog = useMemo(() => log
    .filter((item) => filter === "all" || (item.status || "delivered") === filter)
    .sort((a, b) => order === "newest"
      ? new Date(b.sent_date) - new Date(a.sent_date)
      : new Date(a.sent_date) - new Date(b.sent_date)), [log, order, filter]);

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="Total sent" value={stats.total} />
        <Stat label="Delivered" value={stats.delivered ?? stats.total} />
        <Stat label="Failed" value={stats.failed ?? 0} />
        <Stat label="Last 7 days" value={stats.last7} />
        <Stat label="Weekly" value={stats.weekly} />
        <Stat label="End of plan" value={stats.endOfPlan} />
        <Stat label="Manual" value={stats.manual ?? 0} />
        <Stat label="Recipients" value={stats.recipients} />
      </div>

      <div className="aqla-panel overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 p-5">
          <Mail className="h-4 w-4 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-foreground">Sent email log</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stats.lastSent ? `Most recent delivery ${new Date(stats.lastSent).toLocaleString()}` : "No deliveries recorded yet"}
              {" · status is recorded at send time; mailbox bounces are not reported back"}
            </p>
          </div>
          <div className="flex gap-1 rounded-full bg-secondary/60 p-1">
            {FILTERS.map((item) => (
              <button key={item.id} type="button" onClick={() => setFilter(item.id)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  filter === item.id ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {item.label}
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm"
            onClick={() => setOrder((o) => o === "newest" ? "oldest" : "newest")}>
            {order === "newest" ? <ArrowDownWideNarrow className="mr-1.5 h-3.5 w-3.5" /> : <ArrowUpWideNarrow className="mr-1.5 h-3.5 w-3.5" />}
            {order === "newest" ? "Newest first" : "Oldest first"}
          </Button>
        </div>

        {sortedLog.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t border-border/60 px-5 py-12 text-center">
            <MailX className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No emails match this view.</p>
            <p className="text-xs text-muted-foreground">Weekly, end-of-plan and manual emails appear here with their delivery status.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 border-t border-border/60">
            {sortedLog.map((email) => (
              <div key={email.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3.5">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">{KIND_LABELS[email.kind] || email.kind}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] ${STATUS_STYLES[email.status] || STATUS_STYLES.delivered}`}>
                  {STATUS_LABELS[email.status] || "Delivered"}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm text-foreground">{email.subject}</p>
                <p className="w-full truncate text-xs text-muted-foreground sm:w-auto">{email.recipientName} · {email.recipient}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{new Date(email.sent_date).toLocaleDateString()}</p>
                {email.error_message && <p className="w-full text-xs text-destructive">{email.error_message}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}