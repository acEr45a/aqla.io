import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { draftFollowUp } from "@/lib/clinicalFlag";
import { X, Loader2, Send } from "lucide-react";

// patientId comes from the selected member in the clinician UI and always wins
// over the flag's own user_id — the recommendation must never be addressed to
// the signed-in clinician.
export default function FollowUpComposer({ flag, patientId, onClose, onSent }) {
  const targetUserId = patientId || flag.user_id;
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const text = await draftFollowUp({ messageSnippet: flag.message_snippet, userName: flag.user_name });
        if (active) setDraft(text);
      } catch { /* ignore — clinician can type manually */ }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [flag]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    if (!targetUserId) { setError("No member is attached to this flag — open it from the member's profile."); return; }
    setSending(true);
    setError("");
    try {
      await base44.functions.invoke("pushMemberRecommendation", {
        user_id: targetUserId,
        title: "A follow-up from your AQLA clinician",
        message: draft.trim(),
        category: "follow_up",
      });
      await base44.entities.ClinicalFlag.update(flag.id, { status: "actioned", clinician_note: draft.trim() });
      onSent();
    } catch (e) {
      setError(e.message || "Could not send");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-foreground">Follow up with {flag.user_name || "member"}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">AI draft — review and edit before sending. This sends a recommendation pop-up and email to the member.</p>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Drafting…</div>
        ) : (
          <>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6}
              className="mt-4 w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40" />
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={send} disabled={!draft.trim() || sending}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send follow-up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}