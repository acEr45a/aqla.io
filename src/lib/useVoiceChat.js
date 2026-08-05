import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { loadVoicePrefs } from "@/lib/voicePrefs";

const Recognition = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export const speechSupported = typeof window !== "undefined" && "Audio" in window;
export const micSupported = !!Recognition;
export const voiceSupported = speechSupported;

export const VOICE_BY_MOOD = { calm: "river", neutral: "river", focused: "spark", warm: "honey" };

// Browser speech recognition with high-quality generated speech for AQLA replies.
export default function useVoiceChat({ onTranscript, onSpeechEnd } = {}) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const recRef = useRef(null);
  const audioRef = useRef(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;
  const endCbRef = useRef(onSpeechEnd);
  endCbRef.current = onSpeechEnd;

  const bufferRef = useRef("");
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = loadVoicePrefs().accent || "en-US";
    // Listen continuously and only submit after a real silence gap, so a
    // mid-sentence pause never cuts the user off.
    rec.interimResults = true;
    rec.continuous = true;
    const submitBuffer = () => {
      clearTimeout(silenceTimerRef.current);
      const text = bufferRef.current.trim();
      bufferRef.current = "";
      if (text) cbRef.current?.(text);
    };
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) bufferRef.current += event.results[i][0].transcript + " ";
      }
      // Any speech activity (even interim) resets the silence window.
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (bufferRef.current.trim()) rec.stop(); // onend submits
      }, 1500);
    };
    rec.onend = () => { setListening(false); submitBuffer(); };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { clearTimeout(silenceTimerRef.current); rec.onresult = null; rec.onend = null; rec.abort?.(); };
  }, []);

  useEffect(() => () => audioRef.current?.pause(), []);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    if (!recRef.current || listening) return;
    stopSpeaking();
    bufferRef.current = "";
    recRef.current.lang = loadVoicePrefs().accent || "en-US";
    setVoiceMode(true);
    setListening(true);
    try { recRef.current.start(); } catch { setListening(false); }
  }, [listening, stopSpeaking]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback(async (text, prefetchedUrl) => {
    if (!text || !speechSupported) return;
    stopSpeaking();
    setSpeaking(true);
    let url = prefetchedUrl;
    if (!url) {
      const prefs = loadVoicePrefs();
      const res = await base44.integrations.Core.GenerateSpeech({
        text,
        voice: VOICE_BY_MOOD[prefs.mood] || "honey",
        language_code: "en",
      });
      url = res.url;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { setSpeaking(false); endCbRef.current?.(); };
    audio.onerror = () => setSpeaking(false);
    audio.play().catch(() => setSpeaking(false));
  }, [stopSpeaking]);

  return { listening, speaking, voiceMode, setVoiceMode, startListening, stopListening, speak, stopSpeaking };
}