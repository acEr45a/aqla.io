import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const when = (value) => {
  if (!value) return "Never run";
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Ran minutes ago";
  if (hours < 24) return `Ran ${hours}h ago`;
  return `Ran ${Math.floor(hours / 24)}d ago`;
};

export default function OpsJobCard({ job }) {
  const healthy = job.failed === 0;
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground">{job.name}</p>
        {healthy ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7BC950]" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#E8C63A]" />
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{job.detail}</p>
      <p className="mt-3 font-display text-2xl text-foreground tabular-nums">{job.total}</p>
      <div className="mt-1 flex items-baseline justify-between text-[11px] text-muted-foreground">
        <span>{when(job.last)}</span>
        {job.failed > 0 && <span className="text-[#E8C63A]">{job.failed} need attention</span>}
      </div>
    </div>
  );
}