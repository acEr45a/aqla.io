import React from "react";

export default function ReviewRecommendation({ analysis, currentFamily, onDecision, saving }) {
  const switchSuggested = analysis.should_switch && analysis.recommended_family !== currentFamily;
  return (
    <div className="space-y-5">
      <div><p className="text-xs uppercase tracking-widest text-muted-foreground">What AQLA observed</p><p className="mt-2 text-sm leading-relaxed">{analysis.observed_results}</p></div>
      <div><p className="text-xs uppercase tracking-widest text-muted-foreground">AQLA Intelligence suggests</p><p className="mt-2 text-sm leading-relaxed">{analysis.summary}</p></div>
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <p className="font-display text-lg">{switchSuggested ? `Consider switching to ${analysis.recommended_family}` : `Continue with ${currentFamily}`}</p>
        <p className="mt-2 text-sm text-muted-foreground">{analysis.reason}</p>
        <p className="mt-3 text-xs text-muted-foreground">Confidence: {analysis.confidence} · The final choice is yours.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => onDecision("continue")} disabled={saving} className="rounded-full border border-border py-3 text-sm">Keep {currentFamily}</button>
        {switchSuggested && <button onClick={() => onDecision("switch")} disabled={saving} className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground">Switch to {analysis.recommended_family}</button>}
      </div>
    </div>
  );
}