import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, CircleHelp } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function HelpAgentChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const existing = await base44.agents.listConversations({ agent_name: "help_agent" });
        let conv;
        if (existing && existing.length > 0) {
          conv = existing[0];
        } else {
          conv = await base44.agents.createConversation({
            agent_name: "help_agent",
            metadata: { name: "Help Center Chat", description: "In-app help assistant" },
          });
        }
        setConversation(conv);
        setMessages(conv.messages || []);
        setLoading(false);
        unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
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
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversation || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content: text });
      setSending(false);
    } catch {
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
    <div className="aqla-panel rounded-3xl overflow-hidden flex flex-col" style={{ height: "520px" }}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/40">
        <CircleHelp className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="font-display text-sm text-foreground">AQLA Help Assistant</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/70" /> Remembers your context
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <CircleHelp className="w-7 h-7 text-muted-foreground/40 mx-auto" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-muted-foreground">Ask me anything about AQLA — your scores, protocols, tests, or how to use a feature.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {msg.role === "user" ? (
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
                {msg.tool_calls?.map((tc, idx) => {
                  const isFailed = tc.status === "failed" || tc.status === "error";
                  const hide = tc.display_projection?.hide_details && tc.display_projection?.details_redacted;
                  return (
                    <div key={idx} className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className={isFailed ? "text-destructive" : "text-primary/70"}>
                        {isFailed ? "✗" : "↳"} {hide ? (tc.display_projection?.label || "tool") : (tc.name || "tool")}
                      </span>
                      {!hide && tc.status === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border/40 px-4 py-3 flex items-center gap-2">
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