import React, { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { generateDailyPlanPdf } from "@/lib/dailyPlanPdf";

export default function DailyPlanPdfButton({ user, protocol, checkIns, domains, className }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    setLoading(true);
    try {
      generateDailyPlanPdf({ user, protocol, checkIns, domains });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading || !protocol}
      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-card/60 hover:border-foreground/30 transition-colors text-sm text-foreground disabled:opacity-50 ${className || ""}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {loading ? "Preparing…" : "Download today's plan (PDF)"}
    </button>
  );
}