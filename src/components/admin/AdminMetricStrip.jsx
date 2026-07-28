import React from "react";

export default function AdminMetricStrip({ overview }) {
  const items = [
    ["Registered users", overview.users],
    ["Assessments", overview.assessments],
    ["Daily check-ins", overview.checkIns],
    ["Active protocols", overview.activeProtocols],
    ["Summary emails", overview.summaryEmails],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map(([label, value]) => (
        <div key={label} className="aqla-panel rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl text-foreground tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  );
}