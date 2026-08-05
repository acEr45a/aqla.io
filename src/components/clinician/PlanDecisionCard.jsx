import React, { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";

const FAMILY_COLORS = {
  SPARK: "#C9F24E", FLOW: "#7B94FF", DRIVE: "#F2C04E",
  LEARN: "#5FD4E8", RESET: "#E8A28F", DIGITAL: "#A3A3A3",
};

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "");

export default function PlanDecisionCard({ review, onRevert, revertingId, revertError, revertedId }) {
  const family = review.protocol_family;
  const color = FAMILY_COLORS[family] || "#A3A3A3";
  const switched = review.decision === "switch";
  const member = String(review.created_by_id || "—").slice(0, 8);
  const isReverting = revertingId === review.id;
  const isReverted = revertedId === review.id;
  const failed = revertError === review.id;

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <p className="font-display text-sm text-foreground">{family || "Protocol"}</p>
          {review.recommended_family && review.recommended_family !== family && (
            <span className="text-[11px] text-muted-foreground">→ {review.recommended_family}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {review.confidence && (
            <span className="text-[11px] capitalize text-muted-foreground">{review.confidence}</span>
          )}
          <span className={`px-2.5 py-1 rounded-full border text-[11px] ${switched ? "text-[#7B94FF] border-[#7B94FF]/40" : "text-[#C9F24E] border-[#C9F24E]/40"}`}>
            {switched ? "Switched" : "Continued"}
          </span>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Member {member}
        {review.cycle_started_date && ` · cycle ${fmtDate(review.cycle_started_date)}`}
        {review.completed_date && ` · decided ${fmtDate(review.completed_date)}`}
      </p>
      {review.analysis_summary && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">{review.analysis_summary}</p>
      )}
      {review.observed_results && (
        <p className="mt-2 text-xs leading-relaxed text-foreground/70">{review.observed_results}</p>
      )}
      {review.recommendation_reason && (
        <p className="mt-2 text-xs italic text-muted-foreground">{review.recommendation_reason}</p>
      )}

      {switched && onRevert && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
          {isReverted ? (
            <p className="text-[11px] text-[#C9F24E]">Restored to {family}.</p>
          ) : (
            <button
              onClick={() => onRevert(review)}
              disabled={isReverting}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {isReverting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              {isReverting ? "Reverting…" : `Revert to ${family || "previous"}`}
            </button>
          )}
          {failed && <span className="text-[11px] text-[#E8A28F]">Could not revert — try again.</span>}
        </div>
      )}
    </div>
  );
}