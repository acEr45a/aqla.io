import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Shared AQLA Intelligence conversation logic (Coach page + floating assistant).
export function useAqlaCoach() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.BrainDomain.list("-updated_date"),
      base44.entities.Protocol.filter({ status: "active" }, "-created_date", 1),
      base44.entities.DailyCheckIn.list("-date", 7),
      base44.entities.Experiment.list("-created_date", 3),
    ]).then(([domains, protocols, checkIns, experiments]) => {
      setContext({ domains, protocol: protocols[0], checkIns, experiments });
    });
  }, []);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are AQLA Intelligence, a calm, evidence-aware brain-performance analyst inside the AQLA app.
Rules: ground answers ONLY in the user data below; mention uncertainty; separate observation from inference; never diagnose, never advise on medication, never override safety rules; admit when data is insufficient; recommend clinician review for red flags. Be concise and precise. No hype.

USER DATA:
Brain domains: ${JSON.stringify((context?.domains || []).map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend, limiting: d.limiting_factors })))}
Active protocol: ${JSON.stringify(context?.protocol ? { name: context.protocol.name, family: context.protocol.family, objective: context.protocol.objective, why: context.protocol.why_selected } : "none")}
Recent check-ins (1-10 scales): ${JSON.stringify((context?.checkIns || []).map((c) => ({ date: c.date, clarity: c.clarity, energy: c.energy, stress: c.stress, sleep: c.sleep_quality })))}
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
        },
        required: ["observed", "explanation", "confidence", "next_action"],
      },
    });

    setMessages((m) => [...m, { role: "aqla", ...res }]);
    setLoading(false);
  };

  return { messages, loading, ask };
}