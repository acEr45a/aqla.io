import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldAlert, Check, Pencil, HelpCircle, X } from "lucide-react";

const STATUS_STYLE = {
  pending: "text-[#F2C04E] border-[#F2C04E]/40",
  approved: "text-[#C9F24E] border-[#C9F24E]/40",
  modified: "text-[#7B94FF] border-[#7B94FF]/40",
  info_requested: "text-[#5FD4E8] border-[#5FD4E8]/40",
  rejected: "text-[#E8756B] border-[#E8756B]/40",
};

const DECISIONS = [
  { status: "approved", label: "Approve", icon: Check },
  { status: "modified", label: "Approve with modification", icon: Pencil },
  { status: "info_requested", label: "Request information", icon: HelpCircle },
  { status: "rejected", label: "Reject", icon: X },
];

export default function ReviewCard({ review, onUpdate }) {
  const [saving, setSaving] = useState(false);

  const decide = async (status) => {
    setSaving(true);
    await base44.entities.ClinicianReview.update(review.id, {
      status, decided_date: new Date().toISOString(),
    });
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="aqla-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-foreground">{review.user_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{review.goal}</p>
        </div>
        <span className={`px-3 py-1 rounded-full border text-[11px] capitalize ${STATUS_STYLE[review.status] || STATUS_STYLE.pending}`}>
          {review.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-5 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Proposed recommendation</p>
          <p className="text-foreground/90">{review.recommendation}</p>
          <p className="text-xs text-muted-foreground mt-3 mb-1">Evidence level</p>
          <p className="text-foreground/90">{review.evidence_level || "Not graded"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">AI reasoning trace</p>
          <p className="text-foreground/80 text-xs leading-relaxed">{review.ai_reasoning}</p>
        </div>
      </div>

      {review.safety_flags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {review.safety_flags.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8756B]/10 text-[#E8A28F] text-[11px]">
              <ShieldAlert className="w-3 h-3" /> {f}
            </span>
          ))}
        </div>
      )}

      {review.status === "pending" && (
        <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-border/50">
          {DECISIONS.map(({ status, label, icon: Icon }) => (
            <button key={status} disabled={saving} onClick={() => decide(status)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border text-xs text-foreground/80 hover:bg-secondary transition-colors disabled:opacity-50">
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}