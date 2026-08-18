import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { base44 } from "@/api/base44Client";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import AdminMetricStrip from "@/components/admin/AdminMetricStrip";
import RegistrationChart from "@/components/admin/RegistrationChart";
import ActivityChart from "@/components/admin/ActivityChart";
import ProtocolChart from "@/components/admin/ProtocolChart";
import SiteVisitsChart from "@/components/admin/SiteVisitsChart";
import VisitBreakdown from "@/components/admin/VisitBreakdown";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AdminRolePanel from "@/components/admin/AdminRolePanel";
import UserPlanPanel from "@/components/admin/UserPlanPanel";
import BackendOpsSummary from "@/components/admin/BackendOpsSummary";
import DevelopmentPanel from "@/components/admin/DevelopmentPanel";
import PdfStudioPanel from "@/components/admin/PdfStudioPanel";
import MemberDataPanel from "@/components/admin/MemberDataPanel";

import EmailLogPanel from "@/components/admin/EmailLogPanel";
import AnalyticsPanel from "@/components/admin/AnalyticsPanel";
import SiteDataPanel from "@/components/admin/SiteDataPanel";
import ManualEmailComposer from "@/components/admin/ManualEmailComposer";
import GameRatingsPanel from "@/components/admin/GameRatingsPanel";
import OpsConsoleWidget from "@/components/admin/OpsConsoleWidget";
import AppHealthPanel from "@/components/admin/AppHealthPanel";
import TestModeToggle from "@/components/admin/TestModeToggle";
import ProtocolCleanupPanel from "@/components/admin/ProtocolCleanupPanel";
import NotifyClinicianCard from "@/components/admin/NotifyClinicianCard";
import AdminRoster from "@/components/superadmin/AdminRoster";
import CaptchaEditor from "@/components/superadmin/CaptchaEditor";
import SuperAdminLogs from "@/components/superadmin/SuperAdminLogs";
import UserComplaintsPanel from "@/components/admin/UserComplaintsPanel";
import AdminInboxEmbed from "@/components/admin/AdminInboxEmbed";

const TABS = [
{ id: "overview", label: "Overview" },
{ id: "analytics", label: "Analytics" },
{ id: "emails", label: "Emails" },
{ id: "siteData", label: "Site data" },
{ id: "users", label: "Users & access" },
{ id: "ops", label: "Backend Ops" },
{ id: "memberData", label: "Member data" },
{ id: "development", label: "Development" }];


export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [allowed, setAllowed] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [tab, setTab] = useState("overview");

  const load = React.useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return setAllowed(false);
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      const role = profile?.role || "user";
      if (role !== "admin" && role !== "clinician") {
        return setAllowed(false);
      }
      setAllowed(true);
      base44.functions.invoke("superAdminOps", { action: "check" })
        .then((r) => setIsSuperAdmin(!!r?.data?.isSuperAdmin || !!r?.data?.is_super_admin || !!r?.is_super_admin))
        .catch(() => {});
      const response = await base44.functions.invoke("getAdminDashboardMetrics", {});
      const metrics = response?.data || response;
      if (metrics) {
        setData(metrics);
      }
    } catch (err) {
      console.warn('[AdminDashboard] Load error:', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
          <h1 className="mt-1 text-3xl font-light text-foreground">AQLA Backend Manager</h1>
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
        {isSuperAdmin && (
          <button onClick={() => setTab("superAdmin")}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
            tab === "superAdmin" ? "bg-primary/15 text-primary" : "text-primary/70 hover:text-primary"}`}>
            Super Admin
          </button>
        )}
      </div>

      <div className="mt-5 space-y-5">
        {tab === "overview" &&
        <>
            <AppHealthPanel />
            <TestModeToggle />
            <ProtocolCleanupPanel />
            <UserComplaintsPanel />
            <div className="grid gap-5 lg:grid-cols-2">
              <RegistrationChart data={data.days} />
              <ActivityChart data={data.days} />
            </div>
            <SiteVisitsChart data={data.days} />
            <VisitBreakdown visits={data.visits} />
            <ProtocolChart data={data.protocolFamilies} />
            <GameRatingsPanel ratings={data.ratings} />
            <PdfStudioPanel />
          </>
        }
        {tab === "analytics" && <AnalyticsPanel analytics={data.analytics} />}
        {tab === "emails" &&
        <>
            <AdminInboxEmbed isSuperAdmin={isSuperAdmin} />
            <ManualEmailComposer users={data.allUsers} onSent={load} />
            <EmailLogPanel stats={data.emails.stats} log={data.emails.log} />
          </>
        }
        {tab === "siteData" && <SiteDataPanel siteData={data.siteData} days={data.days} />}
        {tab === "users" &&
        <>
            <NotifyClinicianCard users={data.allUsers} />
            <AdminRolePanel />
            <UserPlanPanel users={data.usersByPlan} />
            <AdminUserTable users={data.recentUsers} onDeleted={load} />
          </>
        }
        {tab === "ops" && <BackendOpsSummary />}
        {tab === "memberData" && <MemberDataPanel />}
        {tab === "development" && <DevelopmentPanel />}
        {tab === "superAdmin" && isSuperAdmin &&
        <>
            <AdminRoster />
            <CaptchaEditor />
            <SuperAdminLogs />
          </>
        }
      </div>

      <OpsConsoleWidget />
    </div>);

}