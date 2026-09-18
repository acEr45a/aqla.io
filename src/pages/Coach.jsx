import React, { useEffect, useRef, useState } from "react";
import { apiClient, runAiWorker } from "@/api/apiClient";
import { activateProtocolFamily } from "@/lib/protocolPlan";
import useVoiceChat, { micSupported } from "@/lib/useVoiceChat";
import VoiceButton, { VoiceStatus } from "@/components/coach/VoiceButton";
import VoiceSettings from "@/components/coach/VoiceSettings";
import AqlaReply from "@/components/coach/AqlaReply";
import AqlaLogo from "@/components/AqlaLogo";
import replyToSpeech from "@/lib/aqlaSpeech";
import { Send, Sparkles } from "lucide-react";

const SUGGESTED = [
  "Why has my focus been worse this week?",
  "Which habit should I change first?",
  "Why was SPARK not recommended?",
  "When is my best focus window?",
  "What is affecting my sleep?",
];

export default function Coach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const endRef = useRef(null);
  const voiceModeRef = useRef(false);

  useEffect(() => {
    Promise.all([
      apiClient.entities.BrainDomain.list("-updated_date"),
      apiClient.entities.Protocol.list("-created_date"),
      apiClient.entities.DailyCheckIn.list("-date", 14),
      apiClient.entities.Experiment.list("-created_date", 3),
    ]).then(([domains, protocols, checkIns, experiments]) => {
      setContext({ domains, protocol: protocols.find((item) => item.status === "active"), protocols, checkIns, experiments });
    });
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);

    // Centralized in worker-registry.ts: aqla_intelligence_turn (same worker as the
    // floating assistant — one prompt, one schema, one model assignment).
    const res = await runAiWorker("aqla_intelligence_turn", {
      brain_domains: (context?.domains || []).map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend, limiting: d.limiting_factors })),
      active_protocol: context?.protocol ? { name: context.protocol.name, family: context.protocol.family, objective: context.protocol.objective, why: context.protocol.why_selected } : null,
      available_plan_families: (context?.protocols || []).map((plan) => ({ family: plan.family, objective: plan.objective })),
      recent_check_ins: (context?.checkIns || []).map((c) => ({ date: c.date, clarity: c.clarity, energy: c.energy, stress: c.stress, sleep: c.sleep_quality, caffeine_drinks: c.caffeine_drinks, caffeine_last_time: c.caffeine_last_time })),
      experiments: (context?.experiments || []).map((e) => ({ hypothesis: e.hypothesis, confidence: e.confidence, results: e.results })),
      user_question: question,
    });

    setMessages((m) => [...m, { role: "aqla", ...res }]);
    setLoading(false);
    if (voiceModeRef.current) {
      voice.speak(replyToSpeech(res));
    }
  };

  const voiceRef = useRef(null);
  const voice = useVoiceChat({
    onTranscript: (text) => { voiceModeRef.current = true; ask(text); },
    onSpeechEnd: () => { if (voiceModeRef.current && voiceRef.current) voiceRef.current.startListening(); },
  });
  useEffect(() => { voiceRef.current = voice; }, [voice]);

  const confirmPlanChange = async (index) => {
    const message = messages[index];
    setLoading(true);
    const protocol = await activateProtocolFamily(message.recommended_family);
    setContext((current) => ({ ...current, protocol }));
    setMessages((current) => current.map((item, i) => i === index ? { ...item, plan_change_status: "confirmed" } : item));
    setLoading(false);
  };

  const cancelPlanChange = (index) => setMessages((current) => current.map((item, i) => i === index ? { ...item, plan_change_status: "cancelled" } : item));

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <AqlaLogo showWordmark={false} className="text-primary" />
        <p className="text-xs tracking-widest uppercase">AQLA Intelligence</p>
      </div>
      <h1 className="mt-2 text-3xl font-light text-foreground">Your analyst, grounded in your data.</h1>

      <div className="mt-6">
        <VoiceSettings onPreview={(text) => voice.speak(text)} />
      </div>

      <div className="flex-1 mt-8 space-y-6">
        {messages.length === 0 && (
          <div className="aqla-panel rounded-3xl p-8">
            <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
              Ask about your focus, sleep, protocol, or evidence. Answers use your Brain Map, check-ins, and experiments —
              and AQLA will say when it doesn't have enough data.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SUGGESTED.map((q) => (
                <button key={q} onClick={() => ask(q)}
                  className="px-4 py-2 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-md bg-secondary rounded-2xl rounded-br-sm px-5 py-3 text-sm text-foreground">{m.text}</p>
            </div>
          ) : (
            <AqlaReply key={i} message={m} onSpeak={() => voice.speak(replyToSpeech(m))} onConfirmPlanChange={() => confirmPlanChange(i)} onCancelPlanChange={() => cancelPlanChange(i)} />
          )
        )}

        <VoiceStatus listening={voice.listening} speaking={voice.speaking} />

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> AQLA is analyzing your data…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="sticky bottom-20 md:bottom-4 mt-8">
        <div className="flex items-center gap-2 aqla-panel rounded-full pl-6 pr-2 py-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask AQLA Intelligence…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          {micSupported && (
            <VoiceButton listening={voice.listening} speaking={voice.speaking}
              onStartListening={voice.startListening} onStopListening={voice.stopListening}
              onStopSpeaking={voice.stopSpeaking} />
          )}
          <button type="submit" onClick={() => { voiceModeRef.current = false; }} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}