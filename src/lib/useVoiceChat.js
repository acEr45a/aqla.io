import { useCallback, useEffect, useRef, useState } from "react";
import { loadVoicePrefs, moodOf, pickVoice } from "@/lib/voicePrefs";

const Recognition = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
export const micSupported = !!Recognition;
export const voiceSupported = speechSupported;

// Browser-native speech in + speech out for AQLA Intelligence.
export default function useVoiceChat({ onTranscript } = {}) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const recRef = useRef(null);
  const utterRef = useRef(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;

  // Chrome loads the voice list asynchronously — warm it up so the first speak() has voices.
  useEffect(() => {
    if (!speechSupported) return;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener?.("voiceschanged", warm);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", warm);
  }, []);

  useEffect(() => {
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = loadVoicePrefs().accent || "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      if (text) cbRef.current?.(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { rec.onresult = null; rec.abort?.(); };
  }, []);

  const startListening = useCallback(() => {
    if (!recRef.current || listening) return;
    window.speechSynthesis?.cancel();
    recRef.current.lang = loadVoicePrefs().accent || "en-US";
    setVoiceMode(true);
    setListening(true);
    try { recRef.current.start(); } catch { setListening(false); }
  }, [listening]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text) => {
    if (!text || !speechSupported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const prefs = loadVoicePrefs();
    const mood = moodOf(prefs.mood);
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(prefs.accent);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || prefs.accent || "en-US";
      u.rate = mood.rate;
      u.pitch = mood.pitch;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      utterRef.current = u; // keep a reference so the utterance isn't garbage-collected mid-speech
      setSpeaking(true);
      synth.speak(u);
    };
    if (!synth.getVoices().length) {
      const once = () => { synth.removeEventListener?.("voiceschanged", once); start(); };
      synth.addEventListener?.("voiceschanged", once);
      setTimeout(start, 300);
      return;
    }
    start();
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { listening, speaking, voiceMode, setVoiceMode, startListening, stopListening, speak, stopSpeaking };
}