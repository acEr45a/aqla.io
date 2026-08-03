import React, { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

const KIND_LABELS = { daily: "Daily plan", weekly: "Weekly report", end_of_plan: "Cycle report", plan: "Plan report" };
const KIND_COLORS = { daily: "#C9F24E", weekly: "#5FD4E8", end_of_plan: "#7B94FF", plan: "#B89CF6" };

export default function ReportRow({ kind, title, date, subtitle, onDownload }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      await onDownload();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-card/60 px-4 md:px-5 py-4">
      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border shrink-0"
        style={{ color: KIND_COLORS[kind], borderColor: `${KIND_COLORS[kind]}40`, background: `${KIND_COLORS[kind]}10` }}>
        {KIND_LABELS[kind] || kind}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle || date}</p>
      </div>
      <button onClick={handleClick} disabled={loading}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border hover:border-foreground/30 transition-colors text-xs text-foreground disabled:opacity-50 shrink-0">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
        PDF
      </button>
    </div>
  );
}