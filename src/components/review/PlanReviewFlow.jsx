import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import ReviewSurvey from "@/components/review/ReviewSurvey";
import ReviewRecommendation from "@/components/review/ReviewRecommendation";
import { analyzePlanReview } from "@/lib/analyzePlanReview";
import { activateProtocolFamily } from "@/lib/protocolPlan";

export default function PlanReviewFlow({ protocol, checkIns, onComplete }) {
  const [values, setValues] = useState({ overall: 5, focus: 5, recovery: 5, reflection: "", side_effects: "" });
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const analyze = async () => { setBusy(true); setAnalysis(await analyzePlanReview(protocol, checkIns, values)); setBusy(false); };
  const decide = async (decision) => {
    setBusy(true);
    await base44.entities.PlanReview.create({
      protocol_id: protocol.id, protocol_family: protocol.family, cycle_started_date: protocol.start_date,
      responses: values, analysis_summary: analysis.summary, observed_results: analysis.observed_results,
      recommendation_reason: analysis.reason, recommended_family: analysis.recommended_family,
      confidence: analysis.confidence, decision, completed_date: new Date().toISOString(),
    });
    const family = decision === "switch" ? analysis.recommended_family : protocol.family;
    await activateProtocolFamily(family, "completed");
    setBusy(false);
    onComplete();
  };
  return (
    <div className="mx-auto max-w-xl px-6 py-14">
      <p className="text-xs uppercase tracking-widest text-primary">Required 14-day review</p>
      <h1 className="mt-3 text-3xl font-light">How did this plan affect you?</h1>
      <p className="mt-3 mb-9 text-sm text-muted-foreground">You completed 14 daily check-ins on {protocol.family}. AQLA will compare your reflection with those signals.</p>
      {analysis ? <ReviewRecommendation analysis={analysis} currentFamily={protocol.family} onDecision={decide} saving={busy} /> : <ReviewSurvey values={values} onChange={setValues} onSubmit={analyze} loading={busy} />}
    </div>
  );
}