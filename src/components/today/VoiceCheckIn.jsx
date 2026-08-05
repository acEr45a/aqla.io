import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import useVoiceChat, { micSupported, VOICE_BY_MOOD } from "@/lib/useVoiceChat";
import { loadVoicePrefs } from "@/lib/voicePrefs";
import VoiceButton, { VoiceStatus } from "@/components/coach/VoiceButton";
import { RotateCcw, Send, Check, MessageCircle } from "lucide-react";

const FIELDS = [
  { key: "clarity", label: "Clarity" },
  { key: "energy", label: "Energy" },
  { key: "stress", label: "Stress" },
  { key: "sleep_quality", label: "Sleep" },
];

const INTRO_KEY = "aqla_voice_checkin_used";

const INTERVIEW_PROMPT = `You are AQLA Intelligence, the user's personal brain-health coach, conducting a voice daily check-in. You are talking to the user out loud, so keep every reply short, warm and natural — like a thoughtful friend who genuinely listens.

This is a strict turn-based conversation. You ask exactly ONE question, then STOP and wait for the user's answer. Never ask more than one question per turn. Never list topics. After each user answer, briefly acknowledge it in one short sentence (reflect their own wording so they feel heard), then ask ONLY the next not-yet-answered question.

Ask about these four topics, one at a time, each a 1-10 scale:
1. Mental clarity (1 = foggy/scattered, 10 = sharp and crystal clear)
2. Energy (1 = exhausted, 10 = fully charged)
3. Stress (1 = completely calm, 10 = overwhelmed)
4. Sleep quality (1 = terrible, 10 = deeply restorative)

Rules:
- Infer each numeric value (1-10) from the user's natural-language answer. If they give no number, estimate from their words ("pretty good" ≈ 7, "awful" ≈ 2, "fine" ≈ 6). If genuinely ambiguous, ask a gentle one-line clarifier instead of moving on.
- If the user interrupts or cuts you off, accept it gracefully — treat whatever they say as their answer to the current question and continue. Never comment on the interruption.
- If the user says something off-topic or just chats, respond naturally like a person would, then gently bring them back to the current unanswered question.
- Capture caffeine intake (drinks, rough amount, timing), today's main demand, and a short note ONLY if the user mentions them naturally — never ask for these directly.
- When all four core topics are answered, set complete=true. Your \`reply\` then becomes a 2-3 sentence interpretation spoken naturally to the user: what stands out about their brain day, what to watch, one gentle suggestion. Put the same interpretation in \`interpretation\`.`;

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

  const runInterview = useCallback(async (msgArray, userText, isFirst) => {
    setLoading(true);
    const usedBefore = !!localStorage.getItem(INTRO_KEY);
    const history = msgArray.map((m) => `${m.role === "user" ? "User" : "AQLA"}: ${m.text}`).join("\n");
    const turn = isFirst
      ? `This is the very beginning. ${usedBefore ? "The user has done this before, so skip any intro and just ask the first question (mental clarity) naturally." : "Formally introduce yourself first: say your name (AQLA Intelligence), explain in one sentence that you're their personal brain-health coach doing a quick daily voice check-in, that you'll ask four short questions in their own words, they can tap to cut you off and answer anytime, and they can redo any answer. Then ask the first question (mental clarity). Keep the whole reply under four sentences."}`
      : `The user just said: "${userText}"`;

    let res;
    try {
      res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_1_pro",
        prompt: `${INTERVIEW_PROMPT}

Conversation so far:
${history || "(none yet)"}

${turn}

Return your reply, the full set of extracted values so far (merge with anything already extracted), and whether all four core topics are now answered.`,
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string" },
            extracted_values: {
              type: "object",
              properties: {
                clarity: { type: ["number", "null"] },
                energy: { type: ["number", "null"] },
                stress: { type: ["number", "null"] },
                sleep_quality: { type: ["number", "null"] },
                caffeine_drinks: { type: ["string", "null"] },
                caffeine_last_time: { type: ["string", "null"] },
                demand: { type: ["string", "null"] },
                note: { type: ["string", "null"] },
              },
            },
            complete: { type: "boolean" },
            interpretation: { type: "string" },
          },
          required: ["reply", "extracted_values", "complete", "interpretation"],
        },
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
    if (isFirst && !usedBefore) localStorage.setItem(INTRO_KEY, "1");
    if (voiceModeRef.current) voiceRef.current?.speak(res.reply);
  }, []);

  // Prefetch the first question's LLM reply AND its audio on mount, so tapping
  // "Start" begins speaking instantly instead of waiting on a serial chain.
  const firstTurnRef = useRef(null); // { msg, audioUrl }
  const [firstReady, setFirstReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const usedBefore = !!localStorage.getItem(INTRO_KEY);
        const history = "";
        const turn = `This is the very beginning. ${usedBefore ? "The user has done this before, so skip any intro and just ask the first question (mental clarity) naturally." : "Formally introduce yourself first: say your name (AQLA Intelligence), explain in one sentence that you're their personal brain-health coach doing a quick daily voice check-in, that you'll ask four short questions in their own words, they can tap to cut you off and answer anytime, and they can redo any answer. Then ask the first question (mental clarity). Keep the whole reply under four sentences."}`;
        const res = await base44.integrations.Core.InvokeLLM({
          model: "gemini_3_1_pro",
          prompt: `${INTERVIEW_PROMPT}\n\nConversation so far:\n${history || "(none yet)"}\n\n${turn}\n\nReturn your reply, the full set of extracted values so far (merge with anything already extracted), and whether all four core topics are now answered.`,
          response_json_schema: {
            type: "object",
            properties: {
              reply: { type: "string" },
              extracted_values: { type: "object", properties: {
                clarity: { type: ["number", "null"] }, energy: { type: ["number", "null"] },
                stress: { type: ["number", "null"] }, sleep_quality: { type: ["number", "null"] },
                caffeine_drinks: { type: ["string", "null"] }, caffeine_last_time: { type: ["string", "null"] },
                demand: { type: ["string", "null"] }, note: { type: ["string", "null"] },
              } },
              complete: { type: "boolean" }, interpretation: { type: "string" },
            },
            required: ["reply", "extracted_values", "complete", "interpretation"],
          },
        });
        if (cancelled) return;
        const msg = { role: "aqla", text: res.reply, extracted: res.extracted_values, complete: res.complete, interpretation: res.interpretation };
        // Prefetch the spoken audio in parallel with nothing else waiting.
        let audioUrl = null;
        try {
          const prefs = loadVoicePrefs();
          const { url } = await base44.integrations.Core.GenerateSpeech({
            text: res.reply, voice: VOICE_BY_MOOD[prefs.mood] || "honey", language_code: "en",
          });
          audioUrl = url;
        } catch { /* fallback: generate on the fly when speaking */ }
        if (cancelled) return;
        firstTurnRef.current = { msg, audioUrl };
        setFirstReady(true);
      } catch { /* fallback to live runInterview on Start */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
    const prefetched = firstTurnRef.current;
    if (prefetched?.msg) {
      setLoading(false);
      const next = [prefetched.msg];
      messagesRef.current = next;
      setMessages(next);
      if (!localStorage.getItem(INTRO_KEY)) localStorage.setItem(INTRO_KEY, "1");
      if (voiceModeRef.current) voiceRef.current?.speak(prefetched.msg.text, prefetched.audioUrl);
      return;
    }
    runInterview([], "", true);
  }, [started, runInterview]);

  const submitText = (text) => {
    if (!text.trim() || loading || isComplete) return;
    const next = [...messagesRef.current, { role: "user", text }];
    messagesRef.current = next;
    setMessages(next);
    setInput("");
    runInterview(next, text, false);
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
            AQLA Intelligence will introduce itself, then ask you four quick questions in your own words. Tap the mic anytime to cut it off and answer — you can redo any answer, and it'll read your day back to you at the end.
          </p>
          <button onClick={start}
            className="mt-5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            {firstReady ? "Start voice check-in" : "Preparing…"}
          </button>
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto scrollbar-none space-y-3 pr-1">
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