import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import OpsJobCard from "@/components/admin/ops/OpsJobCard";
import OpsActivityChart from "@/components/admin/ops/OpsActivityChart";
import OpsWriteMix from "@/components/admin/ops/OpsWriteMix";
import OpsAgentActivity from "@/components/admin/ops/OpsAgentActivity";

const Metric = ({ label, value }) => (
  <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-lg text-foreground tabular-nums">{value}</p>
  </div>
);

export default function BackendOpsSummary() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions.invoke("getBackendOpsSummary", {})
      .then((res) => (res.data?.days ? setData(res.data) : setError(res.data?.error || "Could not load ops summary.")))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading backend ops summary…</div>;

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Data writes" value={data.totals.writes} />
        <Metric label="Writes today" value={data.totals.last24hWrites} />
        <Metric label="Email jobs" value={data.totals.emailJobs} />
        <Metric label="AI tasks" value={data.totals.aiTasks} />
        <Metric label="Security events" value={data.totals.securityEvents} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.jobs.map((job) => <OpsJobCard key={job.name} job={job} />)}
      </div>

      <OpsActivityChart days={data.days} />
      <OpsWriteMix writeMix={data.writeMix} checklist={data.checklist} />
      <OpsAgentActivity />
    </section>
  );
}