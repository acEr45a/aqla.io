import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { activateProtocolFamily } from "@/lib/protocolPlan";

// Shared AQLA Intelligence conversation logic (Coach page + floating assistant).
export function useAqlaCoach() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.BrainDomain.list("-updated_date"),
      base44.entities.Protocol.list("-created_date"),
      base44.entities.DailyCheckIn.list("-date", 14),
      base44.entities.Experiment.list("-created_date", 3),
    ]).then(([domains, protocols, checkIns, experiments]) => {
      setContext({ domains, protocol: protocols.find((item) => item.status === "active"), protocols, checkIns, experiments });
    });
  }, []);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are AQLA Intelligence, a calm, evidence-aware brain-performance analyst inside the AQLA app.
Rules: ground answers ONLY in the user data below; mention uncertainty; separate observation from inference; never diagnose, never advise on medication, never override safety rules; admit when data is insufficient; recommend clinician review for red flags. Be concise and precise. No hype. If the user explicitly asks to change plans, assess the five available families and propose at most one different plan. Never change it yourself: set plan_change_requested true so the app can ask the user to confirm.

USER DATA:
Brain domains: ${JSON.stringify((context?.domains || []).map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend, limiting: d.limiting_factors })))}
Active protocol: ${JSON.stringify(context?.protocol ? { name: context.protocol.name, family: context.protocol.family, objective: context.protocol.objective, why: context.protocol.why_selected } : "none")}
Available plan families: ${JSON.stringify((context?.protocols || []).map((plan) => ({ family: plan.family, objective: plan.objective })))}
Recent check-ins (1-10 scales; caffeine is free text the user typed — interpret the drink type, approximate caffeine load in mg, and timing yourself, and state your interpretation as an inference, not a fact): ${JSON.stringify((context?.checkIns || []).map((c) => ({ date: c.date, clarity: c.clarity, energy: c.energy, stress: c.stress, sleep: c.sleep_quality, caffeine_drinks: c.caffeine_drinks, caffeine_last_time: c.caffeine_last_time })))}
Experiments: ${JSON.stringify((context?.experiments || []).map((e) => ({ hypothesis: e.hypothesis, confidence: e.confidence, results: e.results })))}

USER QUESTION: ${question}`,
      response_json_schema: {
        type: "object",
        properties: {
          observed: { type: "string", description: "What AQLA observed in the data" },
          explanation: { type: "string", description: "Most likely explanation" },
          confidence: { type: "string", enum: ["low", "moderate", "high"] },
          next_action: { type: "string" },
          safety_note: { type: "string", description: "Only if relevant, else empty string" },
          plan_change_requested: { type: "boolean" },
          recommended_family: { type: "string", enum: ["NONE", "SPARK", "FLOW", "DRIVE", "LEARN", "RESET"] },
          change_reason: { type: "string" },
        },
        required: ["observed", "explanation", "confidence", "next_action", "plan_change_requested", "recommended_family"],
      },
    });

    setMessages((m) => [...m, { role: "aqla", ...res }]);
    setLoading(false);
  };

  const confirmPlanChange = async (index) => {
    const message = messages[index];
    if (!message?.plan_change_requested || message.recommended_family === "NONE") return;
    setLoading(true);
    const protocol = await activateProtocolFamily(message.recommended_family);
    setContext((current) => ({ ...current, protocol }));
    setMessages((current) => current.map((item, i) => i === index ? { ...item, plan_change_status: "confirmed" } : item));
    setLoading(false);
  };

  const cancelPlanChange = (index) => setMessages((current) => current.map((item, i) => i === index ? { ...item, plan_change_status: "cancelled" } : item));

  return { messages, loading, ask, confirmPlanChange, cancelPlanChange };
}