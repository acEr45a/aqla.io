import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/api/apiClient";
import { Send, Loader2, CircleHelp, Flag, BookOpen, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { autoFlagResponse, detectClinicalContent, CLINICAL_NOTE } from "@/lib/clinicalFlag";

function CitationBadge({ match }) {
  const [open, setOpen] = useState(false);
  const title = match.title || "Platform Knowledge Reference";
  const similarity = match.similarity ? `${Math.round(match.similarity * 100)}% match` : null;

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
      >
        <BookOpen className="h-3 w-3 shrink-0" />
        <span className="truncate max-w-[200px] sm:max-w-xs">{title}</span>
        {similarity && <span className="font-mono text-[9px] opacity-75">({similarity})</span>}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-1.5 rounded-xl border border-border/50 bg-secondary/30 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground/80 mb-1">{title}</p>
          <p>{match.content}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpAgentChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const scrollRef = useRef(null);
  const processedRef = useRef(new Set());

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session?.user) return;
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
        if (profile) setUser({ id: session.user.id, email: session.user.email, ...profile });
      }).catch(() => {});
      try {
        const existing = await apiClient.agents.listConversations({ agent_name: "help_agent" });
        let conv;
        if (existing && existing.length > 0) {
          conv = existing[0];
        } else {
          conv = await apiClient.agents.createConversation({
            agent_name: "help_agent",
            metadata: { name: "Help Center Chat", description: "In-app help assistant" },
          });
        }
        setConversation(conv);
        setMessages(conv.messages || []);
        setLoading(false);
        unsub = apiClient.agents.subscribeToConversation(conv.id, (data) => {
          setMessages(data.messages || []);
        });
      } catch {
        setLoading(false);
      }
    })();
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Auto-flag the latest assistant response for clinician review when it contains clinical content.
  useEffect(() => {
    if (!messages.length || !user) return;
    const last = [...messages].reverse().find((m) => m.role !== "user" && m.content);
    if (!last || processedRef.current.has(last.content)) return;
    processedRef.current.add(last.content);
    if (detectClinicalContent(last.content)) {
      autoFlagResponse({ sourceAgent: "help_agent", message: last.content, user }).catch(() => {});
    }
  }, [messages, user]);

  const handleSend = async () => {
    if (!input.trim() || !conversation || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await apiClient.agents.addMessage(conversation, { role: "user", content: text });
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="aqla-panel rounded-3xl overflow-hidden flex flex-col h-[60vh] min-h-[420px] sm:h-[520px] max-h-[75vh]">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/40 bg-card/40">
        <CircleHelp className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="font-display text-sm text-foreground font-semibold">AQLA Help Assistant</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> RAG Verified • DeepSeek V3.1
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <CircleHelp className="w-7 h-7 text-muted-foreground/40 mx-auto" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-muted-foreground">Ask me anything about AQLA — your scores, protocols, tests, or how to use a feature.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          const toolCalls = msg.tool_calls || msg.metadata?.tool_executions || [];
          // Extract RAG matches for citation badge
          const ragTool = toolCalls.find((tc) => (tc.tool || tc.name) === "search_knowledge_base");
          const matches = ragTool?.result?.matches || [];

          return (
            <div key={i} className={isUser ? "flex justify-end" : "flex justify-start"}>
              {isUser ? (
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary/15 px-4 py-2.5 text-sm text-foreground">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[85%]">
                  {msg.content && (
                    <ReactMarkdown className="text-sm text-foreground/90 prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}

                  {/* Sleek RAG Citation Badges */}
                  {matches.length > 0 && (
                    <div className="mt-2 space-y-1.5 pt-1 border-t border-border/30">
                      {matches.map((m, mIdx) => (
                        <CitationBadge key={m.id || mIdx} match={m} />
                      ))}
                    </div>
                  )}

                  {detectClinicalContent(msg.content) && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#E8A28F]">
                      <Flag className="h-3 w-3" /> {CLINICAL_NOTE}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Searching knowledge base &amp; formulating verified reply…</span>
          </div>
        )}
      </div>

      <div className="border-t border-border/40 px-4 py-3 flex items-center gap-2 bg-card/20">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your scores, protocols, features…"
          className="flex-1 bg-input/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}