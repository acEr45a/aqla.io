import { runAiWorker } from "@/api/apiClient";

// Centralized in worker-registry.ts: plan_review (prompt + schema live server-side).
export function analyzePlanReview(protocol, checkIns, responses) {
  return runAiWorker("plan_review", {
    current_plan: { family: protocol.family, objective: protocol.objective },
    daily_check_ins: checkIns.map((item) => ({ clarity: item.clarity, energy: item.energy, stress: item.stress, sleep: item.sleep_quality, note: item.note })),
    user_review: responses,
  }, { timeoutMs: 60000 });
}