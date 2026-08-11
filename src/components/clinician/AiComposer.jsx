import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { autoFlagResponse } from "@/lib/clinicalFlag";
import { notify } from "@/lib/clinicianToast";
import { X, Loader2, Send, Sparkles, RefreshCw } from "lucide-react";

const INTENTS = [
  { value: "check_in", label: "Check-in follow-up" },
  { value: "protocol_review", label: "Protocol review" },
  { value: "safety_follow_up", label: "Safety follow-up" },
  { value: "progress_acknowledgment", label: "Progress acknowledgment" },
  { value: "general", label: "General note" },
];

// AI-powered clinician-to-member composer. Drafts run through the Backend Ops
// Gemini model using strictly-clinical member data (protocol, check-ins,
// cognitive tests, brain domains, assessment, safety screening). PII and
// admin-only data are stripped server-side before the model sees the prompt.
export default function AiComposer({ member, onClose, onSent }) {
  const [intent, setIntent] = useState("check_in");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setDraft("");
    try {
      const res = await base44.functions.invoke("draftClinicianMessage", {
        user_id: member.id,
        intent,
        note: note.trim(),
      });
      const text = res.data?.draft || "";
      if (!text) {
        setError("No draft returned. Try again or write manually.");
      } else {
        setDraft(text);
      }
    } catch (e) {
      setError(e?.message || "Could not generate draft.");
    }
    setLoading(false);
  };

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await base44.functions.invoke("pushMemberRecommendation", {
        user_id: member.id,
        title: `A note from your AQLA clinician`,
        message: draft.trim(),
        category: intent === "safety_follow_up" ? "safety" : "follow_up",
      });
      // Auto-flag if the outgoing message contains clinical content.
      const flagged = await autoFlagResponse({
        sourceAgent: "clinician_composer",
        message: draft.trim(),
        user: { id: member.id, full_name: member.name },
      });
      notify(
        "Message sent",
        flagged
          ? "Sent to member — clinical content flagged for review."
          : `Sent to ${member.name} — will appear on their dashboard.`
      );
      onSent?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || "Could not send.");
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
        <div className="flex items-center justify-between pr-1">
          <p className="font-display text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" /> AI composer · {member.name}
          </p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Drafted by Backend Ops (Gemini) from this member's clinical data only. Review and edit before sending.
        </p>

        {/* Intent + optional note */}
        <div className="mt-4 space-y-2.5">
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none"
          >
            {INTENTS.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional focus (e.g. sleep this week, protocol adherence…)"
            className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none"
          />
          <button
            onClick={generate}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
            {loading ? "Drafting…" : draft ? "Regenerate draft" : "Draft with AI"}
          </button>
        </div>

        {error && <p className="mt-3 text-xs text-[#E8A28F]">{error}</p>}

        {draft && (
          <div className="mt-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={7}
              className="w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={generate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </button>
              <button
                onClick={send}
                disabled={!draft.trim() || sending}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send to member
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-[10px] text-muted-foreground border-t border-border/40 pt-3">
          Generated strictly from recorded clinical data — not a diagnosis. Sensitive identifiers and admin-only data are stripped before drafting.
        </p>
      </div>
    </div>
  );
}