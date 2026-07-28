import React from "react";
import { Mail, MailX } from "lucide-react";

const KIND_LABELS = { weekly: "Weekly digest", end_of_plan: "End of plan" };

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-lg text-foreground tabular-nums">{value}</p>
  </div>
);

export default function EmailLogPanel({ stats, log }) {
  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Total sent" value={stats.total} />
        <Stat label="Last 7 days" value={stats.last7} />
        <Stat label="Weekly" value={stats.weekly} />
        <Stat label="End of plan" value={stats.endOfPlan} />
        <Stat label="Recipients" value={stats.recipients} />
      </div>

      <div className="aqla-panel overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 p-5">
          <Mail className="h-4 w-4 text-primary" />
          <div>
            <p className="font-display text-foreground">Sent email log</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stats.lastSent ? `Most recent delivery ${new Date(stats.lastSent).toLocaleString()}` : "No deliveries recorded yet"}
            </p>
          </div>
        </div>

        {log.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t border-border/60 px-5 py-12 text-center">
            <MailX className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No emails have been sent yet.</p>
            <p className="text-xs text-muted-foreground">Weekly and end-of-plan digests appear here once the scheduled job runs.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 border-t border-border/60">
            {log.map((email) => (
              <div key={email.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3.5">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">{KIND_LABELS[email.kind] || email.kind}</span>
                <p className="min-w-0 flex-1 truncate text-sm text-foreground">{email.subject}</p>
                <p className="w-full truncate text-xs text-muted-foreground sm:w-auto">{email.recipientName} · {email.recipient}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{new Date(email.sent_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}