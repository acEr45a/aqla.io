import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import OpsMessageBubble from "@/components/admin/OpsMessageBubble";
import { Send, Terminal } from "lucide-react";

const PROMPTS = [
  "Which users signed up but never completed an assessment?",
  "Are summary emails going out correctly?",
  "Show me check-in activity over the last 14 days.",
];

export default function BackendOpsConsole() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    base44.agents.createConversation({ agent_name: "backend_ops", metadata: { name: "Backend Ops session" } })
      .then(setConversation);
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => setMessages(data.messages || []));
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    if (!text.trim() || !conversation) return;
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  return (
    <section className="aqla-panel flex h-[520px] flex-col rounded-2xl">
      <div className="border-b border-border/60 p-5">
        <p className="flex items-center gap-2 font-display text-foreground"><Terminal className="h-4 w-4 text-primary" /> Backend Ops agent</p>
        <p className="mt-1 text-xs text-muted-foreground">Diagnoses platform data and system issues. Separate from AQLA Intelligence.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Ask about platform state, delivery problems, or stuck users.</p>
            <div className="flex flex-wrap gap-2">
              {PROMPTS.map((prompt) => (
                <button key={prompt} onClick={() => send(prompt)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message, index) => <OpsMessageBubble key={index} message={message} />)}
        <div ref={endRef} />
      </div>

      <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2 rounded-full bg-secondary/60 pl-4 pr-1.5 py-1.5">
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Backend Ops…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          <button type="submit" disabled={!input.trim() || !conversation}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </section>
  );
}