import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import OpsMessageBubble from "@/components/admin/OpsMessageBubble";
import { Send, X, Terminal, Code2 } from "lucide-react";

// Backend Ops = lime (platform health / metrics). Architect = indigo (deep build / structure).
const MODES = {
  ops: {
    key: "ops",
    label: "Backend Ops",
    accent: "#C9F24E",
    icon: Terminal,
    placeholder: "Ask Backend Ops about platform state…",
    prompts: [
      "Which users signed up but never completed an assessment?",
      "Are summary emails going out correctly?",
      "Show me check-in activity over the last 14 days.",
    ],
  },
  architect: {
    key: "architect",
    label: "AQLA Architect",
    accent: "#6C9EFF",
    icon: Code2,
    placeholder: "Ask the Architect about structure, ideas, or code…",
    prompts: [
      "Refine this idea: a streak tracker for daily check-ins",
      "Generate 3 fresh feature ideas around the games catalog",
      "Review the open dev checklist and suggest what to tackle next",
    ],
  },
};

const MODE_TAG = {
  ops: "[Backend Ops mode — platform health, metrics, data diagnostics]",
  architect: "[Architect mode — development checklist, features, architecture, code structure]",
};

export default function OpsConsoleWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("ops");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const cfg = MODES[mode];

  useEffect(() => {
    if (!open || conversation) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await base44.agents.listConversations({ agent_name: "backend_ops" });
        const latest = Array.isArray(existing) && existing.length ? existing[0] : null;
        if (cancelled) return;
        setConversation(
          latest || (await base44.agents.createConversation({ agent_name: "backend_ops", metadata: { name: "Backend Ops widget" } }))
        );
      } catch {
        if (cancelled) return;
        const created = await base44.agents.createConversation({ agent_name: "backend_ops", metadata: { name: "Backend Ops widget" } });
        if (!cancelled) setConversation(created);
      }
    })();
    return () => { cancelled = true; };
  }, [open, conversation]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) =>
      setMessages(data.messages || [])
    );
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    if (!text.trim() || !conversation) return;
    const framed = `${MODE_TAG[mode]}\n\n${text}`;
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: framed });
  };

  const accentStyle = { color: cfg.accent };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card shadow-lg shadow-black/40 transition-transform hover:scale-105"
          style={{ boxShadow: `0 0 0 1px ${cfg.accent}22, 0 10px 30px rgba(0,0,0,0.45)` }}
          aria-label="Open Backend Ops"
        >
          <cfg.icon className="h-5 w-5" style={accentStyle} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-5 right-5 z-50 flex h-[560px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/50"
          style={{ boxShadow: `0 0 0 1px ${cfg.accent}22, 0 20px 50px rgba(0,0,0,0.55)` }}
        >
          {/* Header with toggle */}
          <div className="border-b border-border/60 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: cfg.accent }} />
                <span className="font-mono text-[11px] uppercase tracking-widest text-foreground">
                  Backend Ops
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="mt-3 flex rounded-full bg-secondary/60 p-1">
              {Object.values(MODES).map((m) => {
                const active = m.key === mode;
                return (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors"
                    style={
                      active
                        ? { background: m.accent, color: "#0A0A0A" }
                        : { color: "hsl(var(--muted-foreground))" }
                    }
                  >
                    <m.icon className="h-3.5 w-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {mode === "ops"
                    ? "Diagnose platform data, delivery, and stuck users."
                    : "Plan features, refine ideas, and review the dev checklist."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cfg.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${cfg.accent}55`)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <OpsMessageBubble key={index} message={message} accent={cfg.accent} />
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="border-t border-border/60 p-3"
          >
            <div className="flex items-center gap-2 rounded-full bg-secondary/60 pl-4 pr-1.5 py-1.5">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={cfg.placeholder}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!input.trim() || !conversation}
                className="flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-30"
                style={{ background: cfg.accent, color: "#0A0A0A" }}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}