import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import OpsMessageBubble from "@/components/admin/OpsMessageBubble";
import OpsSidebar from "@/components/admin/OpsSidebar";
import { manualFlagResponse } from "@/lib/clinicalFlag";
import { Send, X, Terminal, Code2, PanelLeft } from "lucide-react";

// Backend Ops = lime (platform health / metrics). Architect = indigo (deep build / structure).
// Each mode keeps its own conversation history, persisted server-side and tagged with metadata.mode.
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

// Map a conversation to its mode (new convs use metadata.mode; legacy ones use the old fixed names).
const convMode = (conv) => {
  const m = conv?.metadata?.mode;
  if (m === "ops" || m === "architect") return m;
  const name = conv?.metadata?.name;
  if (name === "Backend Ops" || name === "Backend Ops widget") return "ops";
  if (name === "AQLA Architect") return "architect";
  return null;
};

const stripTag = (text) => text.replace(/^\[[^\]]*\]\s*/, "").trim();
const titleFromMessage = (text) => {
  const clean = stripTag(text).split("\n")[0].trim();
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || "New chat";
};

export default function OpsConsoleWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("ops");
  const [showSidebar, setShowSidebar] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const [conversationsByMode, setConversationsByMode] = useState({ ops: [], architect: [] });
  const [activeIdByMode, setActiveIdByMode] = useState({ ops: null, architect: null });
  const [messagesByMode, setMessagesByMode] = useState({ ops: [], architect: [] });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [flaggedContent, setFlaggedContent] = useState(() => new Set());
  const endRef = useRef(null);

  const cfg = MODES[mode];

  const loadConversations = async (m) => {
    try {
      const all = await base44.agents.getConversations({ agent_name: "backend_ops" });
      const list = (Array.isArray(all) ? all : [])
        .filter((c) => convMode(c) === m)
        .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0));
      setConversationsByMode((prev) => ({ ...prev, [m]: list }));
      return list;
    } catch {
      return [];
    }
  };

  const openConversation = async (conv, m) => {
    setActiveIdByMode((prev) => ({ ...prev, [m]: conv.id }));
    try {
      const full = await base44.agents.getConversation(conv.id);
      setMessagesByMode((prev) => ({ ...prev, [m]: full.messages || [] }));
    } catch {
      setMessagesByMode((prev) => ({ ...prev, [m]: conv.messages || [] }));
    }
  };

  const deleteChat = async (conv, m) => {
    try {
      await base44.agents.deleteConversation(conv.id);
    } catch {
      /* ignore */
    }
    const remaining = conversationsByMode[m].filter((c) => c.id !== conv.id);
    setConversationsByMode((prev) => ({ ...prev, [m]: remaining }));
    if (activeIdByMode[m] === conv.id) {
      if (remaining[0]) {
        await openConversation(remaining[0], m);
      } else {
        setActiveIdByMode((prev) => ({ ...prev, [m]: null }));
        setMessagesByMode((prev) => ({ ...prev, [m]: [] }));
      }
    }
  };

  const creatingPromiseRef = useRef({ ops: null, architect: null });
  // Returns a promise that resolves to the created conversation (or null on failure).
  // Concurrent callers share the same promise so we never create two chats at once.
  const newChat = (m) => {
    if (creatingPromiseRef.current[m]) return creatingPromiseRef.current[m];
    creatingPromiseRef.current[m] = (async () => {
      try {
        const created = await base44.agents.createConversation({
          agent_name: "backend_ops",
          metadata: { name: "New chat", mode: m },
        });
        setConversationsByMode((prev) => ({ ...prev, [m]: [created, ...prev[m]] }));
        setActiveIdByMode((prev) => ({ ...prev, [m]: created.id }));
        setMessagesByMode((prev) => ({ ...prev, [m]: [] }));
        return created;
      } catch {
        return null;
      } finally {
        creatingPromiseRef.current[m] = null;
      }
    })();
    return creatingPromiseRef.current[m];
  };

  // When the panel opens, load the active mode's conversations (and select/create as needed).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const list = await loadConversations(mode);
      if (cancelled) return;
      if (activeIdByMode[mode]) return;
      if (list.length) {
        await openConversation(list[0], mode);
      } else {
        await newChat(mode);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  // Subscribe to the active conversation for the current mode (streams new messages).
  useEffect(() => {
    const id = activeIdByMode[mode];
    if (!id) return;
    const unsubscribe = base44.agents.subscribeToConversation(id, (data) =>
      setMessagesByMode((prev) => ({ ...prev, [mode]: data.messages || [] }))
    );
    return () => unsubscribe();
  }, [activeIdByMode, mode]);

  const messages = messagesByMode[mode];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mode]);

  useEffect(() => { base44.auth.me().then(setAdminUser).catch(() => {}); }, []);

  const handleFlag = async (message) => {
    if (!message?.content || flaggedContent.has(message.content)) return;
    const ok = await manualFlagResponse({ message: message.content, admin: adminUser });
    if (ok) setFlaggedContent((prev) => new Set(prev).add(message.content));
  };

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    let activeId = activeIdByMode[mode];
    let conv = conversationsByMode[mode].find((c) => c.id === activeId);
    // No active conversation yet (e.g. just opened) — create one on demand so the quick-start prompts work immediately.
    if (!activeId || !conv) {
      conv = await newChat(mode);
      if (!conv) return;
      activeId = conv.id;
    } else {
      // Always pass a full conversation object to addMessage (the SDK requires it).
      try {
        conv = await base44.agents.getConversation(activeId);
        setConversationsByMode((prev) => (prev[mode].some((c) => c.id === activeId) ? prev : { ...prev, [mode]: [conv, ...prev[mode]] }));
      } catch {
        conv = { id: activeId, agent_name: "backend_ops" };
      }
    }
    const framed = `${MODE_TAG[mode]}\n\n${trimmed}`;
    setInput("");
    setSending(true);
    // Name the chat after the first message if it's still the default (local only — SDK has no rename API).
    if (conv && (conv.metadata?.name === "New chat" || !conv.metadata?.name)) {
      const title = titleFromMessage(trimmed);
      setConversationsByMode((prev) => ({
        ...prev,
        [mode]: prev[mode].map((c) => (c.id === conv.id ? { ...c, metadata: { name: title, mode } } : c)),
      }));
    }
    try {
      await base44.agents.addMessage(conv, { role: "user", content: framed });
    } catch {
      /* surfaced via subscription state */
    } finally {
      setSending(false);
    }
  };

  // Resolve a failed/problematic tool call by asking Backend Ops to investigate and fix it.
  const resolveTool = async ({ name, arguments: args, result, error }) => {
    let activeId = activeIdByMode[mode];
    let conv = conversationsByMode[mode].find((c) => c.id === activeId);
    if (!activeId || !conv) {
      conv = await newChat(mode);
      if (!conv) return;
      activeId = conv.id;
    } else {
      try {
        conv = await base44.agents.getConversation(activeId);
      } catch {
        conv = { id: activeId, agent_name: "backend_ops" };
      }
    }
    const detail = [
      `A tool call in this conversation reported a problem and needs resolution.`,
      `Tool: ${name}`,
      args ? `Arguments: ${JSON.stringify(args)}` : "",
      result ? `Result: ${JSON.stringify(result)}` : "",
      error ? `Error: ${error}` : "",
      `Please investigate the root cause and perform the appropriate corrective action.`,
    ].filter(Boolean).join("\n");
    const framed = `${MODE_TAG[mode]}\n\n${detail}`;
    setSending(true);
    try {
      await base44.agents.addMessage(conv, { role: "user", content: framed });
    } catch {
      /* surfaced via subscription state */
    } finally {
      setSending(false);
    }
  };

  const accentStyle = { color: cfg.accent };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card shadow-lg shadow-black/40 transition-transform hover:scale-105"
          style={{ bottom: "max(env(safe-area-inset-bottom), 1.25rem)", boxShadow: `0 0 0 1px ${cfg.accent}22, 0 10px 30px rgba(0,0,0,0.45)` }}
          aria-label="Open Backend Ops"
        >
          <cfg.icon className="h-5 w-5" style={accentStyle} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex h-[80svh] flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[min(560px,85svh)] sm:w-[min(460px,calc(100vw-2.5rem))] sm:rounded-2xl sm:shadow-2xl sm:shadow-black/50"
          style={{ boxShadow: "0 0 0 1px " + cfg.accent + "22, 0 -10px 40px rgba(0,0,0,0.5)" }}
        >
          {/* Header with toggle */}
          <div className="border-b border-border/60 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSidebar((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Toggle history"
                >
                  <PanelLeft className="h-3.5 w-3.5" />
                </button>
                <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: cfg.accent }} />
                <span className="font-mono text-[11px] uppercase tracking-widest text-foreground">
                  {cfg.label}
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
                    style={active ? { background: m.accent, color: "#0A0A0A" } : { color: "hsl(var(--muted-foreground))" }}
                  >
                    <m.icon className="h-3.5 w-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body: sidebar + chat */}
          <div className="relative flex flex-1 overflow-hidden">
            {showSidebar && (
              <>
                <div className="absolute inset-0 z-10 bg-black/50 sm:hidden" onClick={() => setShowSidebar(false)} />
                <div className="absolute inset-0 z-20 w-full sm:relative sm:inset-auto sm:z-auto sm:w-[150px] shrink-0">
                  <OpsSidebar
                    conversations={conversationsByMode[mode]}
                    activeId={activeIdByMode[mode]}
                    accent={cfg.accent}
                    onSelect={(conv) => { openConversation(conv, mode); if (window.innerWidth < 768) setShowSidebar(false); }}
                    onNew={() => { newChat(mode); if (window.innerWidth < 768) setShowSidebar(false); }}
                    onDelete={(conv) => deleteChat(conv, mode)}
                  />
                </div>
              </>
            )}

            {/* Messages */}
            <div className="flex flex-1 flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {mode === "ops"
                        ? "Diagnose platform data, delivery, and stuck users."
                        : "Plan features, refine ideas, and review the dev checklist."}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {cfg.prompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => send(prompt)}
                          className="w-full sm:w-auto text-left rounded-full border border-border px-4 py-2.5 sm:px-3 sm:py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
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
                  <OpsMessageBubble
                    key={index}
                    message={message}
                    accent={cfg.accent}
                    onResolve={resolveTool}
                    flaggable={mode === "architect"}
                    onFlag={handleFlag}
                    flagged={flaggedContent.has(message.content)}
                  />
                ))}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={(event) => { event.preventDefault(); send(input); }}
                className="border-t border-border/60 p-3"
                style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
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
                    disabled={!input.trim() || !activeIdByMode[mode]}
                    className="flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-30"
                    style={{ background: cfg.accent, color: "#0A0A0A" }}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}