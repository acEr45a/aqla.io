import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminRoster from "@/components/superadmin/AdminRoster";
import CaptchaEditor from "@/components/superadmin/CaptchaEditor";
import SuperAdminLogs from "@/components/superadmin/SuperAdminLogs";
import PageNotFound from "@/lib/PageNotFound";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function SuperAdmins() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    base44.functions.invoke("superAdminOps", { action: "check" })
      .then((r) => setStatus(r.data))
      .catch(() => setStatus({ isSuperAdmin: false }));
  }, []);

  if (!status) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!status.isSuperAdmin) return <PageNotFound />;

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10 space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Super Admin console</p>
            <p className="mt-1 text-sm text-muted-foreground">Sensitive platform controls, API keys, and access grants.</p>
          </div>
        </div>
        <AdminRoster />
        <CaptchaEditor />
        <SuperAdminLogs />
      </div>
      <AdminDashboard />
    </div>
  );
}