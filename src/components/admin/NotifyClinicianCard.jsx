import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, Megaphone } from "lucide-react";

export default function NotifyClinicianCard({ users }) {
  const clinicians = (users || []).filter((u) => u.role === "clinician" && u.email);
  const [clinicianId, setClinicianId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  const send = async (e) => {
    e.preventDefault();
    if (!clinicianId || !subject.trim() || !message.trim() || sending) return;
    setSending(true); setStatus("");
    try {
      const res = await base44.functions.invoke("notifyClinician", { user_id: clinicianId, subject, message });
      if (res.data?.ok) {
        setStatus("Notified.");
        setSubject(""); setMessage(""); setClinicianId("");
      } else {
        setStatus(res.data?.error || "Could not send.");
      }
    } catch (e) { setStatus(e.message); }
    setSending(false);
  };

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-4 w-4 text-primary" />
        <div>
          <p className="font-display text-foreground">Notify a clinician</p>
          <p className="text-xs text-muted-foreground">Send a styled note directly to a clinician's inbox.</p>
        </div>
      </div>
      {clinicians.length === 0 ? (
        <p className="text-sm text-muted-foreground">No clinicians registered yet.</p>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Clinician</label>
            <select value={clinicianId} onChange={(e) => setClinicianId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none">
              <option value="">Select a clinician…</option>
              {clinicians.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary"
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required
              placeholder="Your note to the clinician…"
              className="mt-1.5 w-full resize-none rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          </div>
          {status && <p className={`text-xs ${status === "Notified." ? "text-primary" : "text-destructive"}`}>{status}</p>}
          <button type="submit" disabled={!clinicianId || !subject.trim() || !message.trim() || sending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 transition-opacity">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending…" : "Notify clinician"}
          </button>
        </form>
      )}
    </div>
  );
}