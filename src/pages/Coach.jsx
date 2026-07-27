import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
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

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    setInput("");
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col min-h-[calc(100vh-6rem)]">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">AQLA Intelligence</p>
      <h1 className="mt-2 text-3xl font-light text-foreground">Your analyst, grounded in your data.</h1>

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
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="aqla-panel rounded-3xl rounded-bl-sm p-6 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">What AQLA observed</p>
                <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">{m.observed}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Most likely explanation</p>
                <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">{m.explanation}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Recommended next action</p>
                <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">{m.next_action}</p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <span className="px-3 py-1 rounded-full border border-border text-[11px] text-muted-foreground">Confidence: {m.confidence}</span>
              </div>
              {m.safety_note && (
                <p className="text-xs text-[#F2C04E] border-t border-border/40 pt-3">{m.safety_note}</p>
              )}
            </motion.div>
          )
        )}

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
          <button type="submit" disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}