import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Loader2, Sparkles, FileDown, RotateCcw } from "lucide-react";
import { DEFAULT_THEME, loadPdfTheme } from "@/lib/pdf/fableCore";
import { generateFableDailyPdf } from "@/lib/pdf/fableDaily";
import { generateFableWeeklyPdf } from "@/lib/pdf/fableWeekly";
import { generateFableEndOfPlanPdf } from "@/lib/pdf/fableEndOfPlan";
import { localDateKey } from "@/lib/dateKey";

const SWATCH_LABELS = { bg: "Background", panel: "Panel", border: "Border", text: "Text", muted: "Muted", faint: "Faint", accent: "Accent", positive: "Positive", negative: "Negative", warning: "Warning" };

export default function PdfStudioPanel() {
  const [theme, setTheme] = useState(null);
  const [note, setNote] = useState("");
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => loadPdfTheme().then(setTheme);
  useEffect(() => { refresh(); }, []);

  const applyAI = async () => {
    if (!instruction.trim() || busy) return;
    setBusy(true);
    try {
      const res = await apiClient.functions.invoke("backendOpsAi", { task: "pdfTheme", instruction });
      setNote(res.data.note || "Theme updated.");
      setInstruction("");
      await refresh();
    } catch (e) {
      setNote(e?.response?.data?.error || "Edit failed — try rephrasing.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    const rows = await apiClient.entities.PdfTheme.list("-updated_date", 10);
    await Promise.all(rows.map((r) => apiClient.entities.PdfTheme.delete(r.id)));
    setNote("Theme reset to Fable defaults.");
    refresh();
  };

  const blank = (kind) => {
    const args = { user: { full_name: "Sample User" }, protocol: null, checkIns: [], domains: [], cognitiveTests: [], sessions: [], theme };
    if (kind === "daily") return generateFableDailyPdf(args);
    const start = new Date();
    start.setDate(start.getDate() - (kind === "weekly" ? 6 : 13));
    const gen = kind === "weekly" ? generateFableWeeklyPdf : generateFableEndOfPlanPdf;
    gen({ ...args, periodStart: localDateKey(start), periodEnd: localDateKey(new Date()) });
  };

  const current = theme || DEFAULT_THEME;

  return (
    <div className="aqla-panel rounded-2xl p-5 md:p-6 space-y-6">
      <div>
        <h3 className="font-display text-lg text-foreground">PDF Studio</h3>
        <p className="mt-1 text-sm text-muted-foreground">Edit the Fable document theme with AI. Changes apply instantly to every PDF users download.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(SWATCH_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5">
            <span className="h-4 w-4 rounded-full border border-border" style={{ background: current[key] }} />
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-[11px] font-mono text-foreground/80">{current[key]}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyAI()}
          placeholder='e.g. "make the accent cyan" or "soften the contrast slightly"'
          className="flex-1 rounded-full border border-border bg-card/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
        />
        <button onClick={applyAI} disabled={busy || !instruction.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Apply with AI
        </button>
        <button onClick={reset} disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
      {note && <p className="text-xs text-primary">{note}</p>}

      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Blank template previews</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[["daily", "Daily (2 pages)"], ["weekly", "Weekly (4 pages)"], ["end_of_plan", "End of plan (6 pages)"]].map(([kind, label]) => (
            <button key={kind} onClick={() => blank(kind)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-foreground hover:border-foreground/30 transition-colors">
              <FileDown className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}