import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, X, ArrowUpRight } from "lucide-react";
import { useAqlaCoach } from "@/lib/useAqlaCoach";
import AqlaReply from "@/components/coach/AqlaReply";
import useVoiceChat, { micSupported } from "@/lib/useVoiceChat";
import VoiceButton, { VoiceStatus } from "@/components/coach/VoiceButton";
import replyToSpeech from "@/lib/aqlaSpeech";

const QUICK = [
  "Why has my focus been worse this week?",
  "When is my best focus window?",
  "What should I change first?",
];

export default function AqlaAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, loading, ask, confirmPlanChange, cancelPlanChange } = useAqlaCoach();
  const endRef = useRef(null);
  const voiceModeRef = useRef(false);
  const spokenRef = useRef(0);
  const voice = useVoiceChat({ onTranscript: (text) => { voiceModeRef.current = true; ask(text); } });

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, open]);

  // Read AQLA's reply aloud (voice questions always, typed ones when "speak replies" is on).
  useEffect(() => {
    if (messages.length <= spokenRef.current) return;
    spokenRef.current = messages.length;
    const last = messages[messages.length - 1];
    if (last?.role !== "aqla" || !voiceModeRef.current) return;
    voice.speak(replyToSpeech(last));
  }, [messages, voice]);

  useEffect(() => { if (!open) voice.stopSpeaking(); }, [open, voice]);

  const send = (q) => { voiceModeRef.current = false; setInput(""); ask(q); };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed z-50 bottom-40 md:bottom-24 right-4 md:right-6 w-[min(24rem,calc(100vw-2rem))] max-h-[70vh] flex flex-col rounded-3xl border border-border/70 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <span className="text-sm text-foreground">AQLA Intelligence</span>
              </div>
              <div className="flex items-center gap-1">
                <Link to="/coach" onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground" title="Open full view">
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Ask about your focus, sleep, or protocol — answers use your own Brain Map, check-ins and experiments.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK.map((q) => (
                      <button key={q} onClick={() => send(q)}
                        className="px-3 py-1.5 rounded-full border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {messages.map((m, i) => m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] bg-secondary rounded-2xl rounded-br-sm px-4 py-2.5 text-[13px] text-foreground">{m.text}</p>
                </div>
              ) : (
                <AqlaReply key={i} message={m} compact onSpeak={() => voice.speak(replyToSpeech(m))} onConfirmPlanChange={() => confirmPlanChange(i)} onCancelPlanChange={() => cancelPlanChange(i)} />
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Analyzing your data…
                </div>
              )}
              <VoiceStatus listening={voice.listening} speaking={voice.speaking} />
              <div ref={endRef} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 border-t border-border/60">
              <div className="flex items-center gap-2 rounded-full border border-border pl-4 pr-1 py-1">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask AQLA…"
                  className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none py-2" />
                {micSupported && (
                  <VoiceButton listening={voice.listening} speaking={voice.speaking}
                    onStartListening={voice.startListening} onStopListening={voice.stopListening}
                    onStopSpeaking={voice.stopSpeaking} />
                )}
                <button type="submit" disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.94 }} onClick={() => setOpen((o) => !o)}
        aria-label="AQLA Intelligence"
        className="fixed z-50 bottom-24 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center">
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" strokeWidth={1.75} />}
      </motion.button>
    </>
  );
}