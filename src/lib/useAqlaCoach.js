import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/api/apiClient";
import { activateProtocolFamily } from "@/lib/protocolPlan";
import { autoFlagResponse, CLINICAL_NOTE } from "@/lib/clinicalFlag";

// Token-waste attack resistance for AQLA Intelligence.
const MAX_INPUT_CHARS = 2000;
const MAX_TURNS_PER_HOUR = 20;
const REPEAT_LIMIT = 3; // same prompt this many times in a row → canned redirect

const CANNED = {
  tooLong: "That's a lot to take in — could you trim it to a sentence or two so I can give you a focused answer?",
  rateLimited: "You're asking a lot right now — let's slow down. Give me a moment and ask one question at a time.",
  loop: "I think we've covered this one a few times. If something isn't clear, try rephrasing, or check the Help Center for a fuller breakdown.",
};

const hourKey = () => {
  const bucket = new Date();
  bucket.setMinutes(0, 0, 0);
  return `aqla-coach-turns-${bucket.getTime()}`;
};

const turnsThisHour = () => Number(localStorage.getItem(hourKey()) || 0);
const bumpTurns = () => {
  try { localStorage.setItem(hourKey(), String(turnsThisHour() + 1)); } catch { /* ignore */ }
};

// Shared AQLA Intelligence conversation logic (Coach page + floating assistant).
export function useAqlaCoach() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const lastPromptsRef = useRef([]);
  const userRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (profile) userRef.current = { id: session.user.id, email: session.user.email, ...profile };
    }).catch(() => {});
    Promise.all([
      apiClient.entities.BrainDomain.list("-updated_date"),
      apiClient.entities.Protocol.list("-created_date"),
      apiClient.entities.DailyCheckIn.list("-date", 14),
      apiClient.entities.Experiment.list("-created_date", 3),
    ]).then(([domains, protocols, checkIns, experiments]) => {
      setContext({ domains, protocol: protocols.find((item) => item.status === "active"), protocols, checkIns, experiments });
    });
  }, []);

  const ask = async (question) => {
    const trimmed = (question || "").trim();
    if (!trimmed || loading) return;

    // Guard 1: input length cap — prevents flooding the prompt with huge payloads.
    if (trimmed.length > MAX_INPUT_CHARS) {
      setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "aqla", mode: "chat", chat_reply: CANNED.tooLong }]);
      return;
    }

    // Guard 2: rolling-window rate limit per hour.
    if (turnsThisHour() >= MAX_TURNS_PER_HOUR) {
      setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "aqla", mode: "chat", chat_reply: CANNED.rateLimited }]);
      return;
    }

    // Guard 3: repeat / loop detection — same prompt REPEAT_LIMIT times in a row.
    const recent = lastPromptsRef.current.slice(-REPEAT_LIMIT);
    if (recent.length === REPEAT_LIMIT && recent.every((p) => p === trimmed)) {
      setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "aqla", mode: "chat", chat_reply: CANNED.loop }]);
      return;
    }
    lastPromptsRef.current.push(trimmed);

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setLoading(true);
    bumpTurns();

    const res = await apiClient.integrations.Core.InvokeLLM({
      prompt: `You are AQLA Intelligence, a calm, evidence-aware brain-performance analyst inside the AQLA app.
FIRST decide the mode of your reply:
- mode "chat" — greetings, small talk, thanks, jokes, "how are you", personal chit-chat, general-knowledge questions, definitions, "what is X", simple how/why questions, or anything not specifically about the user's own brain data. Reply warmly and helpfully (1-4 sentences) in chat_reply, like a friendly, knowledgeable colleague. Answer general questions directly and accurately — don't deflect to the app or redirect to brain data. Use the user's name or their data only if it fits naturally. Do NOT fill the analysis fields with placeholders; leave them as empty strings. Never force an analysis on casual or general questions, though you may gently invite a question about their focus, sleep or protocol when it fits.
- mode "analysis" — any question about their cognition, data, protocol, habits or evidence. Fill observed/explanation/next_action/confidence and leave chat_reply empty.

Analysis rules: ground answers ONLY in the user data below; mention uncertainty; separate observation from inference; never diagnose, never advise on medication, never override safety rules; admit when data is insufficient; recommend clinician review for red flags. Be concise and precise. No hype. If the user explicitly asks to change plans, assess the five available families and propose at most one different plan. Never change it yourself: set plan_change_requested true so the app can ask the user to confirm.

ZERO-HALLUCINATION RULES: Never assert clinical claims not supported by the evidence grades in the Ingredient entity. For supplement dosing, always cite the evidence_grade. When uncertain, state uncertainty and recommend consulting a clinician. Never invent drug interactions, contraindications, or diagnostic conclusions. If your reply touches supplements, safety, dosing, or protocol changes, the platform auto-flags it for clinician review.

USER DATA:
Brain domains: ${JSON.stringify((context?.domains || []).map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend, limiting: d.limiting_factors })))}
Active protocol: ${JSON.stringify(context?.protocol ? { name: context.protocol.name, family: context.protocol.family, objective: context.protocol.objective, why: context.protocol.why_selected } : "none")}
Available plan families: ${JSON.stringify((context?.protocols || []).map((plan) => ({ family: plan.family, objective: plan.objective })))}
Recent check-ins (1-10 scales; caffeine is free text the user typed — interpret the drink type, approximate caffeine load in mg, and timing yourself, and state your interpretation as an inference, not a fact): ${JSON.stringify((context?.checkIns || []).map((c) => ({ date: c.date, clarity: c.clarity, energy: c.energy, stress: c.stress, sleep: c.sleep_quality, caffeine_drinks: c.caffeine_drinks, caffeine_last_time: c.caffeine_last_time })))}
Experiments: ${JSON.stringify((context?.experiments || []).map((e) => ({ hypothesis: e.hypothesis, confidence: e.confidence, results: e.results })))}

USER QUESTION: ${trimmed}`,
      response_json_schema: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["chat", "analysis"] },
          chat_reply: { type: "string", description: "Conversational reply for small talk. Empty when mode is analysis." },
          observed: { type: "string", description: "What AQLA observed in the data" },
          explanation: { type: "string", description: "Most likely explanation" },
          confidence: { type: "string", enum: ["low", "moderate", "high"] },
          next_action: { type: "string" },
          safety_note: { type: "string", description: "Only if relevant, else empty string" },
          plan_change_requested: { type: "boolean" },
          recommended_family: { type: "string", enum: ["NONE", "SPARK", "FLOW", "DRIVE", "LEARN", "RESET"] },
          change_reason: { type: "string" },
        },
        required: ["mode", "observed", "explanation", "confidence", "next_action", "plan_change_requested", "recommended_family"],
      },
    });

    const displayText = res.mode === "chat"
      ? (res.chat_reply || "")
      : [res.observed, res.explanation, res.next_action, res.safety_note].filter(Boolean).join(" ");
    const flagged = await autoFlagResponse({ sourceAgent: "aqla_intelligence", message: displayText, user: userRef.current });
    setMessages((m) => [...m, { role: "aqla", ...(flagged ? { ...res, clinical_note: CLINICAL_NOTE } : res) }]);
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