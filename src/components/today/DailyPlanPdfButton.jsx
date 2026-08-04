import React, { useState } from "react";
import { FileDown, Loader2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { generateFableDailyPdf } from "@/lib/pdf/fableDaily";
import { loadPdfTheme } from "@/lib/pdf/fableCore";
import { localDateKey } from "@/lib/dateKey";

export default function DailyPlanPdfButton({ user, protocol, checkIns = [], domains, className }) {
  const [loading, setLoading] = useState(false);
  const today = localDateKey();
  const checkedInToday = checkIns.some((c) => c.date === today);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Fresh server fetch of EVERY data source the PDF uses — never stale props
      const [profiles, tests, fullCheckIns, freshProtocols, freshDomains, theme] = await Promise.all([
        base44.entities.HealthProfile.list("-completed_date", 1),
        base44.entities.CognitiveTest.list("-completed_date", 10),
        base44.entities.DailyCheckIn.list("-date", 30),
        base44.entities.Protocol.filter({ status: "active" }, "-created_date", 1),
        base44.entities.BrainDomain.list("-updated_date"),
        loadPdfTheme(),
      ]);
      const freshProtocol = freshProtocols[0] || protocol;
      generateFableDailyPdf({
        user,
        protocol: freshProtocol,
        checkIns: fullCheckIns.length ? fullCheckIns : checkIns,
        domains: freshDomains.length ? freshDomains : domains,
        healthProfile: profiles[0],
        cognitiveTests: tests,
        theme,
      });
      await base44.entities.PdfArchive.create({
        kind: "daily",
        title: `Daily plan — ${freshProtocol?.name || "AQLA"}`,
        date: today,
        protocol_id: freshProtocol?.id,
        family: freshProtocol?.family,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleDownload}
        disabled={loading || !protocol}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-card/60 hover:border-foreground/30 transition-colors text-sm text-foreground disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        {loading ? "Preparing…" : "Download today's plan (PDF)"}
      </button>
      {!checkedInToday && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-[#F2C04E] max-w-md">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          You haven't done today's check-in — this plan will use dated data. Complete your daily check-in first for an accurate plan.
        </p>
      )}
    </div>
  );
}