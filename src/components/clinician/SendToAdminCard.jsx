import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const CATEGORIES = [
  "Formula problem",
  "Safety concern",
  "Clinical improvement",
  "Ingredient question",
  "Protocol feedback",
  "General note",
];

export default function SendToAdminCard() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!detail.trim() || sending) return;
    setSending(true); setError(""); setResult(null);
    try {
      const res = await base44.functions.invoke("sendClinicianAlert", { category, subject: subject || "Clinician note", detail });
      if (res.data?.delivered !== undefined) setResult(res.data);
      else setError(res.data?.error || "Could not send the alert.");
    } catch (e) {
      setError(e.message);
    }
    setSending(false);
  };

  const reset = () => { setSubject(""); setDetail(""); setResult(null); };

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-primary" />
        <div>
          <p className="font-display text-foreground">Send to admin</p>
          <p className="text-xs text-muted-foreground">Escalate a formula problem or clinical improvement — emailed to every admin with full detail.</p>
        </div>
      </div>

      {result ? (
        <div className="mt-5 rounded-xl border border-[#7BC950]/40 bg-[#7BC950]/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#7BC950]" />
            <p className="text-sm text-foreground">Sent to {result.delivered} of {result.total} admin{result.total === 1 ? "" : "s"}.</p>
          </div>
          {result.total - result.delivered > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#E8C63A]">
              <AlertTriangle className="h-3 w-3" /> {result.total - result.delivered} delivery attempt(s) failed.
            </p>
          )}
          <button onClick={reset} className="mt-3 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            Send another note
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary"
                className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Detail</label>
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={5} required
              placeholder="Describe the problem, formula concern, or suggested clinical improvement in full…"
              className="mt-1.5 w-full resize-none rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button type="submit" disabled={!detail.trim() || sending}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending…" : "Send to admin team"}
          </button>
        </form>
      )}
    </div>
  );
}