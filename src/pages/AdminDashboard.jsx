import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import AdminMetricStrip from "@/components/admin/AdminMetricStrip";
import RegistrationChart from "@/components/admin/RegistrationChart";
import ActivityChart from "@/components/admin/ActivityChart";
import ProtocolChart from "@/components/admin/ProtocolChart";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AdminRolePanel from "@/components/admin/AdminRolePanel";
import BackendOpsConsole from "@/components/admin/BackendOpsConsole";

const TABS = [
{ id: "overview", label: "Overview" },
{ id: "users", label: "Users & access" },
{ id: "ops", label: "Backend Ops" }];


export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [allowed, setAllowed] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      if (user.role !== "admin") return setAllowed(false);
      const response = await base44.functions.invoke("getAdminDashboardMetrics", {});
      setData(response.data);
    };
    load();
  }, []);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
        <h1 className="mt-4 text-2xl text-foreground">Admin access only</h1>
        <p className="mt-2 text-sm text-muted-foreground">This console is restricted to administrator accounts.</p>
      </div>);

  }
  if (!data) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading admin console…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><ShieldCheck className="h-5 w-5" /></div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Admin console</p>
          <h1 className="mt-1 text-3xl font-light text-foreground">AQLA Backend </h1>
          <p className="mt-2 text-sm text-muted-foreground">Analytics, member access, and backend operations in one place.</p>
        </div>
      </div>

      <div className="mt-8"><AdminMetricStrip overview={data.overview} /></div>

      <div className="mt-6 flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((item) =>
        <button key={item.id} onClick={() => setTab(item.id)}
        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
        tab === item.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {item.label}
          </button>
        )}
      </div>

      <div className="mt-5 space-y-5">
        {tab === "overview" &&
        <>
            <div className="grid gap-5 lg:grid-cols-2">
              <RegistrationChart data={data.days} />
              <ActivityChart data={data.days} />
            </div>
            <ProtocolChart data={data.protocolFamilies} />
          </>
        }
        {tab === "users" &&
        <>
            <AdminRolePanel />
            <AdminUserTable users={data.recentUsers} />
          </>
        }
        {tab === "ops" && <BackendOpsConsole />}
      </div>
    </div>);

}