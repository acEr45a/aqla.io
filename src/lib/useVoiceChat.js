import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { loadVoicePrefs } from "@/lib/voicePrefs";

const Recognition = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export const speechSupported = typeof window !== "undefined" && "Audio" in window;
export const micSupported = !!Recognition;
export const voiceSupported = speechSupported;

const VOICE_BY_MOOD = { calm: "river", neutral: "river", focused: "spark", warm: "honey" };

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

  useEffect(() => {
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = loadVoicePrefs().accent || "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text) cbRef.current?.(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { rec.onresult = null; rec.abort?.(); };
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
    recRef.current.lang = loadVoicePrefs().accent || "en-US";
    setVoiceMode(true);
    setListening(true);
    try { recRef.current.start(); } catch { setListening(false); }
  }, [listening, stopSpeaking]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback(async (text) => {
    if (!text || !speechSupported) return;
    stopSpeaking();
    setSpeaking(true);
    const prefs = loadVoicePrefs();
    const { url } = await base44.integrations.Core.GenerateSpeech({
      text,
      voice: VOICE_BY_MOOD[prefs.mood] || "honey",
      language_code: "en",
    });
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { setSpeaking(false); endCbRef.current?.(); };
    audio.onerror = () => setSpeaking(false);
    await audio.play();
  }, [stopSpeaking]);

  return { listening, speaking, voiceMode, setVoiceMode, startListening, stopListening, speak, stopSpeaking };
}