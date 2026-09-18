import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiClient, runAiWorker } from "@/api/apiClient";
import { activateProtocolFamily } from "@/lib/protocolPlan";
import { autoFlagResponse, CLINICAL_NOTE } from "@/lib/clinicalFlag";

// Token-waste attack resistance for AQLA Intelligence.
const MAX_INPUT_CHARS = 2000;
const MAX_TURNS_PER_HOUR = 20;
const REPEAT_LIMIT = 3; // same prompt this many times in a row → canned redirect

const CANNED = {
  tooLong: "That's a lot to take in — could you trim it to a few sentences or less so I can give you a focused answer?",
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
    }).catch(() => { });
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

    // Centralized in worker-registry.ts: aqla_intelligence_turn (prompt + schema live server-side).
    const res = await runAiWorker("aqla_intelligence_turn", {
      brain_domains: (context?.domains || []).map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend, limiting: d.limiting_factors })),
      active_protocol: context?.protocol ? { name: context.protocol.name, family: context.protocol.family, objective: context.protocol.objective, why: context.protocol.why_selected } : null,
      available_plan_families: (context?.protocols || []).map((plan) => ({ family: plan.family, objective: plan.objective })),
      recent_check_ins: (context?.checkIns || []).map((c) => ({ date: c.date, clarity: c.clarity, energy: c.energy, stress: c.stress, sleep: c.sleep_quality, caffeine_drinks: c.caffeine_drinks, caffeine_last_time: c.caffeine_last_time })),
      experiments: (context?.experiments || []).map((e) => ({ hypothesis: e.hypothesis, confidence: e.confidence, results: e.results })),
      user_question: trimmed,
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