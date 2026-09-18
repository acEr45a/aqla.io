import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, runAiWorker } from "@/api/apiClient";
import useVoiceChat, { micSupported, VOICE_BY_MOOD } from "@/lib/useVoiceChat";
import { loadVoicePrefs } from "@/lib/voicePrefs";
import VoiceButton, { VoiceStatus } from "@/components/coach/VoiceButton";
import LipSyncAvatar from "@/components/today/LipSyncAvatar";
import { RotateCcw, Send, Check, MessageCircle } from "lucide-react";

const FIELDS = [
  { key: "clarity", label: "Clarity" },
  { key: "energy", label: "Energy" },
  { key: "stress", label: "Stress" },
  { key: "sleep_quality", label: "Sleep" },
];

const INTRO_KEY = "aqla_voice_checkin_used";

export default function VoiceCheckIn({ onComplete, onCancel }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [saving, setSaving] = useState(false);
  const endRef = useRef(null);
  const voiceModeRef = useRef(true);
  const voiceRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => { messagesRef.current = messages; endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const collected = messages
    .filter((m) => m.role === "aqla" && m.extracted)
    .reduce((acc, m) => ({ ...acc, ...m.extracted }), {});
  const isComplete = messages.some((m) => m.role === "aqla" && m.complete);
  const interpretation = [...messages].reverse().find((m) => m.role === "aqla" && m.interpretation)?.interpretation || "";
  const answeredCount = FIELDS.filter((f) => typeof collected[f.key] === "number").length;
  const latestAqlaMsg = [...messages].reverse().find((m) => m.role === "aqla")?.text || "";

  const runInterview = useCallback(async (msgArray, userText) => {
    setLoading(true);
    const history = msgArray.map((m) => `${m.role === "user" ? "User" : "AQLA"}: ${m.text}`).join("\n");
    const captured = msgArray
      .filter((m) => m.role === "aqla" && m.extracted)
      .reduce((acc, m) => ({ ...acc, ...m.extracted }), {});
    const capturedList = Object.entries(captured).filter(([, v]) => v != null && v !== "");

    let res;
    try {
      // Centralized in worker-registry.ts: voice_checkin (interview rules live server-side).
      res = await runAiWorker("voice_checkin", {
        conversation: history || "(none yet)",
        captured: Object.fromEntries(capturedList),
        latest: userText,
      });
    } catch {
      setLoading(false);
      return;
    }

    const aqlaMsg = { role: "aqla", text: res.reply, extracted: res.extracted_values, complete: res.complete, interpretation: res.interpretation };
    const next = [...msgArray, aqlaMsg];
    messagesRef.current = next;
    setMessages(next);
    setLoading(false);
    if (voiceModeRef.current) voiceRef.current?.speak(res.reply);
  }, []);

  // The first turn is a fixed intro + first question — no LLM round-trip needed.
  const buildFirstMessage = useCallback(() => {
    const usedBefore = !!localStorage.getItem(INTRO_KEY);
    const intro = usedBefore
      ? ""
      : "Hi, I'm AQLA Intelligence, your personal brain-health coach. I'll ask you a few quick questions in your own words — clarity, energy, stress, sleep, caffeine and your day — tap the mic anytime to cut me off, and you can redo any answer. ";
    return { role: "aqla", text: `${intro}Let's start: how's your mental clarity today, in your own words?`, extracted: {}, complete: false, interpretation: "" };
  }, []);

  // Prefetch only the spoken audio for that first message on mount — no LLM wait.
  const firstTurnRef = useRef(null); // { msg, audioUrl }
  useEffect(() => {
    let cancelled = false;
    const msg = buildFirstMessage();
    firstTurnRef.current = { msg, audioUrl: null };
    (async () => {
      try {
        const prefs = loadVoicePrefs();
        const { url } = await apiClient.integrations.Core.GenerateSpeech({
          text: msg.text, voice: VOICE_BY_MOOD[prefs.mood] || "honey", language_code: "en",
        });
        if (cancelled) return;
        firstTurnRef.current = { msg, audioUrl: url };
      } catch { /* speak() will generate live if this fails */ }
    })();
    return () => { cancelled = true; };
  }, [buildFirstMessage]);

  const startCalledRef = useRef(false);
  const start = useCallback(() => {
    if (started || startCalledRef.current) return;
    startCalledRef.current = true;
    setStarted(true);
    const prefetched = firstTurnRef.current;
    const msg = prefetched?.msg || buildFirstMessage();
    const next = [msg];
    messagesRef.current = next;
    setMessages(next);
    if (!localStorage.getItem(INTRO_KEY)) localStorage.setItem(INTRO_KEY, "1");
    if (voiceModeRef.current) voiceRef.current?.speak(msg.text, prefetched?.audioUrl);
  }, [started, buildFirstMessage]);

  const submitText = (text) => {
    if (!text.trim() || loading || isComplete) return;
    const next = [...messagesRef.current, { role: "user", text }];
    messagesRef.current = next;
    setMessages(next);
    setInput("");
    runInterview(next, text);
  };

  const voice = useVoiceChat({
    onTranscript: (text) => submitText(text),
    onSpeechEnd: () => {
      if (voiceModeRef.current && voiceRef.current && !isCompleteRef.current) voiceRef.current.startListening();
    },
  });
  const isCompleteRef = useRef(isComplete);
  useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);
  useEffect(() => { voiceRef.current = voice; }, [voice]);

  const redoLast = () => {
    if (loading) return;
    voice.stopSpeaking();
    setMessages((m) => {
      let arr = [...m];
      if (arr.length && arr[arr.length - 1].role === "aqla") arr.pop();
      if (arr.length && arr[arr.length - 1].role === "user") arr.pop();
      messagesRef.current = arr;
      return arr;
    });
    setTimeout(() => voiceRef.current?.startListening(), 150);
  };

  const save = () => {
    setSaving(true);
    onComplete({
      clarity: collected.clarity ?? 5,
      energy: collected.energy ?? 5,
      stress: collected.stress ?? 5,
      sleep_quality: collected.sleep_quality ?? 5,
      caffeine_drinks: collected.caffeine_drinks || "",
      caffeine_last_time: collected.caffeine_last_time || "",
      demand: collected.demand || "",
      note: collected.note || (interpretation ? `AQLA: ${interpretation}` : ""),
    });
  };

  return (
    <div className="space-y-4">
      {/* progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground tracking-widest uppercase">
          Voice check-in · <span className="text-foreground tabular-nums">{answeredCount}/4</span>
        </span>
        <div className="flex gap-1.5">
          {FIELDS.map((f) => (
            <span key={f.key} className={`h-1.5 w-8 rounded-full ${typeof collected[f.key] === "number" ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>

      {!started ? (
        <div className="aqla-panel rounded-2xl p-7 text-center">
          <MessageCircle className="mx-auto w-6 h-6 text-primary" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-foreground">Talk through your check-in instead</p>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            AQLA Intelligence will introduce itself, then ask you a few quick questions in your own words — clarity, energy, stress, sleep, caffeine and your day. Tap the mic anytime to cut it off and answer — you can redo any answer, and it'll read your day back to you at the end.
          </p>
          <button onClick={start}
            className="mt-5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Start voice check-in
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-center -my-2">
            <LipSyncAvatar
              speaking={voice.speaking}
              listening={voice.listening}
              text={voice.speaking ? latestAqlaMsg : ""}
              onInterrupt={voice.stopSpeaking}
            />
          </div>

          <div className="max-h-48 overflow-y-auto scrollbar-none space-y-3 pr-1">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[80%] bg-secondary rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-foreground">{m.text}</p>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <p className={`max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm ${m.complete ? "bg-primary/10 border border-primary/30 text-foreground" : "bg-secondary/60 text-foreground/90"}`}>
                    {m.text}
                  </p>
                </div>
              )
            )}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> AQLA is listening…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <VoiceStatus listening={voice.listening} speaking={voice.speaking} />

          {isComplete ? (
            <div className="aqla-panel rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Check className="w-4 h-4" strokeWidth={1.75} /> AQLA's read of your day
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{interpretation || "Check-in complete."}</p>
              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving}
                  className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
                  {saving ? "Saving…" : "Save check-in"}
                </button>
                <button onClick={redoLast}
                  className="px-4 py-3 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Redo
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {micSupported && (
                <VoiceButton listening={voice.listening} speaking={voice.speaking}
                  onStartListening={voice.startListening} onStopListening={voice.stopListening}
                  onStopSpeaking={voice.stopSpeaking} />
              )}
              <form onSubmit={(e) => { e.preventDefault(); submitText(input); }} className="flex-1 flex items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Or type your answer…"
                  className="flex-1 bg-secondary/50 border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                <button type="submit" disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </form>
              {messages.some((m) => m.role === "user") && (
                <button onClick={redoLast} title="Say that again" disabled={loading}
                  className="w-10 h-10 rounded-full border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0 disabled:opacity-30">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </>
      )}

      <button onClick={onCancel} className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
        Use sliders instead
      </button>
    </div>
  );
}