import React, { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Loader2, Send, CheckCircle2, AlertOctagon } from "lucide-react";

const CATEGORIES = ["Bug", "Account", "Data issue", "Protocol question", "Safety concern", "Other"];

export default function IssueReportForm() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!detail.trim() || sending) return;
    setSending(true); setError(""); setResult(null);
    try {
      const res = await apiClient.functions.invoke("submitIssue", {
        category,
        subject: subject || "User issue",
        detail,
      });
      if (res.data?.delivered !== undefined) setResult(res.data);
      else setError(res.data?.error || "Could not send.");
    } catch (e) { setError(e.message); }
    setSending(false);
  };

  const reset = () => { setSubject(""); setDetail(""); setResult(null); };

  if (result) {
    return (
      <div className="aqla-panel rounded-3xl p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
          <p className="text-sm text-foreground">Sent to {result.delivered} of {result.total} admin{result.total === 1 ? "" : "s"}.</p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">We'll review and follow up. Thanks for flagging this.</p>
        <button onClick={reset} className="mt-4 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Report another issue
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="aqla-panel rounded-3xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 text-primary" strokeWidth={1.75} />
        <p className="font-display text-foreground">Report an issue</p>
      </div>
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
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={4} required
          placeholder="Describe what happened, what you expected, and any steps to reproduce…"
          className="mt-1.5 w-full resize-none rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button type="submit" disabled={!detail.trim() || sending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 transition-opacity">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending…" : "Send to admin team"}
      </button>
    </form>
  );
}