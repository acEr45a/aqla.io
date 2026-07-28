import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import AdminMetricStrip from "@/components/admin/AdminMetricStrip";
import RegistrationChart from "@/components/admin/RegistrationChart";
import ActivityChart from "@/components/admin/ActivityChart";
import ProtocolChart from "@/components/admin/ProtocolChart";
import AdminUserTable from "@/components/admin/AdminUserTable";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      if (user.role !== "admin") return setAllowed(false);
      const response = await base44.functions.invoke("getAdminDashboardMetrics", {});
      setData(response.data);
    };
    load();
  }, []);

  if (!allowed) return <div className="mx-auto max-w-xl px-6 py-20 text-center"><ShieldAlert className="mx-auto h-8 w-8 text-destructive" /><h1 className="mt-4 text-2xl text-foreground">Admin access only</h1></div>;
  if (!data) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading admin overview…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-xs uppercase tracking-[0.18em] text-primary">Admin workspace</p><h1 className="mt-1 text-3xl font-light text-foreground">AQLA platform pulse</h1><p className="mt-2 text-sm text-muted-foreground">Aggregate registrations, engagement, plans, and summary-email activity.</p></div></div>
      <div className="mt-8"><AdminMetricStrip overview={data.overview} /></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><RegistrationChart data={data.days} /><ActivityChart data={data.days} /></div>
      <div className="mt-5"><ProtocolChart data={data.protocolFamilies} /></div>
      <div className="mt-5"><AdminUserTable users={data.recentUsers} /></div>
    </div>
  );
}