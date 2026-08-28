import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/api/apiClient";
import ReportRow from "@/components/history/ReportRow";
import PlanHistoryCard from "@/components/history/PlanHistoryCard";
import { generateFableDailyPdf } from "@/lib/pdf/fableDaily";
import { generateFableWeeklyPdf } from "@/lib/pdf/fableWeekly";
import { generateFableEndOfPlanPdf } from "@/lib/pdf/fableEndOfPlan";
import { loadPdfTheme } from "@/lib/pdf/fableCore";
import { localDateKey } from "@/lib/dateKey";

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export default function History() {
  const [user, setUser] = useState(null);
  const [archives, setArchives] = useState([]);
  const [digests, setDigests] = useState([]);
  const [protocols, setProtocols] = useState(undefined);
  const [domains, setDomains] = useState([]);
  const [checkInCount, setCheckInCount] = useState(null);

  // Weekly and cycle overviews are rebuilt from check-in data — below three
  // valid check-ins there is nothing meaningful to plot, so we block them.
  const MIN_CHECK_INS = 3;
  const insufficient = checkInCount !== null && checkInCount < MIN_CHECK_INS;
  const insufficientReason = `Insufficient data — needs at least ${MIN_CHECK_INS} check-ins (you have ${checkInCount ?? 0}).`;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (profile) setUser({ id: session.user.id, email: session.user.email, ...profile });
    }).catch(() => {});
    // Guard every list: a failed or malformed response must not blank the page.
    const safeList = (p) => p.then((r) => (Array.isArray(r) ? r : [])).catch(() => []);
    safeList(apiClient.entities.PdfArchive.list("-date", 100)).then(setArchives);
    safeList(apiClient.entities.EmailDigest.list("-sent_date", 100)).then(setDigests);
    safeList(apiClient.entities.Protocol.list("-created_date")).then(setProtocols);
    safeList(apiClient.entities.BrainDomain.list("-updated_date")).then(setDomains);
    safeList(apiClient.entities.DailyCheckIn.list("-date", 400)).then((rows) =>
      setCheckInCount(rows.filter((c) => c?.valid !== false).length)
    );
  }, []);

  const fetchPeriodData = async () => {
    const [checkIns, sessions, tests] = await Promise.all([
      apiClient.entities.DailyCheckIn.list("-date", 100),
      apiClient.entities.GameSession.list("-completed_date", 100),
      apiClient.entities.CognitiveTest.list("-completed_date", 50),
    ]);
    return { checkIns, sessions, cognitiveTests: tests };
  };

  const downloadDaily = async (archive) => {
    const protocol = protocols?.find((p) => p.id === archive.protocol_id) || protocols?.find((p) => p.status === "active") || null;
    const [profiles, tests, checkIns, theme] = await Promise.all([
      apiClient.entities.HealthProfile.list("-completed_date", 1),
      apiClient.entities.CognitiveTest.list("-completed_date", 10),
      apiClient.entities.DailyCheckIn.list("-date", 60),
      loadPdfTheme(),
    ]);
    generateFableDailyPdf({
      user, protocol,
      checkIns: checkIns.filter((c) => c.date <= archive.date),
      domains, healthProfile: profiles[0], cognitiveTests: tests, theme,
    });
  };

  const downloadPeriod = async (kind, start, end, protocol) => {
    const [data, theme] = await Promise.all([fetchPeriodData(), loadPdfTheme()]);
    const gen = kind === "weekly" ? generateFableWeeklyPdf : generateFableEndOfPlanPdf;
    gen({
      periodStart: localDateKey(start),
      periodEnd: localDateKey(end),
      user, protocol, domains, theme, ...data,
    });
  };

  const downloadDigest = (digest) => {
    const protocol = protocols?.find((p) => p.id === digest.protocol_id) || null;
    if (digest.kind === "weekly" && digest.period_key?.startsWith("week-")) {
      const start = new Date(digest.period_key.slice(5));
      return downloadPeriod("weekly", start, addDays(start, 6), protocol);
    }
    const start = new Date(protocol?.start_date || addDays(new Date(digest.sent_date), -14));
    return downloadPeriod("end_of_plan", start, addDays(start, protocol?.duration_days || 14), protocol);
  };

  const downloadPlanReport = (protocol) => {
    const start = new Date(protocol.start_date || protocol.created_date);
    return downloadPeriod("end_of_plan", start, addDays(start, protocol.duration_days || 14), protocol);
  };

  const reports = [
    // Only render records that carry the fields a row needs — skip partial data.
    ...archives.filter((a) => a?.date && a?.title).map((a) => ({ sortDate: a.date, kind: a.kind, title: a.title, subtitle: `Generated ${a.date}`, onDownload: () => downloadDaily(a) })),
    ...digests.filter((d) => d?.sent_date).map((d) => ({
      sortDate: d.sent_date?.slice(0, 10) || "",
      kind: d.kind === "weekly" ? "weekly" : "end_of_plan",
      title: d.subject || (d.kind === "weekly" ? "Weekly report" : "End-of-plan report"),
      subtitle: `Emailed ${d.sent_date?.slice(0, 10) || "—"}`,
      onDownload: () => downloadDigest(d),
    })),
  ].sort((a, b) => (b.sortDate || "").localeCompare(a.sortDate || ""));

  if (protocols === undefined) return <div className="p-10 text-sm text-muted-foreground">Loading history…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">Your records</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">History</h1>
      <p className="mt-3 text-muted-foreground text-sm max-w-xl">
        Every plan, daily PDF and report AQLA has generated for you. Download any of them again —
        weekly and cycle reports rebuild from all data collected in their timeframe.
      </p>

      <h2 className="mt-10 font-display text-lg text-foreground">Reports & PDFs</h2>
      {reports.length ? (
        <div className="mt-4 space-y-px rounded-2xl overflow-hidden border border-border/60">
          {reports.map((r, i) => {
            // Daily PDFs are a single-day snapshot and stay available.
            const blocked = insufficient && r.kind !== "daily";
            return (
              <ReportRow
                key={i}
                {...r}
                date={r.sortDate}
                disabled={blocked}
                disabledReason={blocked ? insufficientReason : undefined}
              />
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground aqla-panel rounded-2xl p-6">
          No reports yet. Download a daily plan from your dashboard, or check in daily — weekly reports arrive every Sunday.
        </p>
      )}

      <h2 className="mt-10 font-display text-lg text-foreground">Plan library</h2>
      {protocols.length ? (
        <div className="mt-4 space-y-3">
          {protocols.map((p) => (
            <PlanHistoryCard
              key={p.id}
              protocol={p}
              onDownload={() => downloadPlanReport(p)}
              downloadDisabled={insufficient}
              disabledReason={insufficient ? insufficientReason : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground aqla-panel rounded-2xl p-6">No plans yet. Complete your assessment to start your first protocol.</p>
      )}
    </div>
  );
}