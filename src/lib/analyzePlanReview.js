import { apiClient } from "@/api/apiClient";

export function analyzePlanReview(protocol, checkIns, responses) {
  return apiClient.integrations.Core.InvokeLLM({
    prompt: `You are AQLA Intelligence reviewing a completed 14-check-in neural wellness plan. Analyze only the supplied data. Do not diagnose or advise on medication. Account for side effects conservatively. Decide whether to suggest continuing or switching among SPARK, FLOW, DRIVE, LEARN, RESET. A switch is only a suggestion; the user makes the final choice.\n\nCurrent plan: ${JSON.stringify({ family: protocol.family, objective: protocol.objective })}\nDaily check-ins: ${JSON.stringify(checkIns.map((item) => ({ clarity: item.clarity, energy: item.energy, stress: item.stress, sleep: item.sleep_quality, note: item.note })))}\nUser review: ${JSON.stringify(responses)}`,
    response_json_schema: {
      type: "object",
      properties: {
        observed_results: { type: "string" },
        summary: { type: "string" },
        reason: { type: "string" },
        should_switch: { type: "boolean" },
        recommended_family: { type: "string", enum: ["SPARK", "FLOW", "DRIVE", "LEARN", "RESET"] },
        confidence: { type: "string", enum: ["low", "moderate", "high"] },
      },
      required: ["observed_results", "summary", "reason", "should_switch", "recommended_family", "confidence"],
    },
  });
}