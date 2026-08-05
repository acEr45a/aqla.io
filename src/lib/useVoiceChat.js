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
  const utteranceRef = useRef(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;
  const endCbRef = useRef(onSpeechEnd);
  endCbRef.current = onSpeechEnd;

  const bufferRef = useRef("");
  const interimRef = useRef("");
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = loadVoicePrefs().accent || "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    const submitBuffer = () => {
      clearTimeout(silenceTimerRef.current);
      const text = `${bufferRef.current} ${interimRef.current}`.trim();
      bufferRef.current = "";
      interimRef.current = "";
      if (text) cbRef.current?.(text);
    };
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += `${transcript} `;
        else interimText += `${transcript} `;
      }
      bufferRef.current = finalText;
      interimRef.current = interimText;
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (`${bufferRef.current} ${interimRef.current}`.trim()) rec.stop();
      }, 1400);
    };
    rec.onend = () => { setListening(false); submitBuffer(); };
    rec.onerror = () => { clearTimeout(silenceTimerRef.current); setListening(false); };
    recRef.current = rec;
    return () => { clearTimeout(silenceTimerRef.current); rec.onresult = null; rec.onend = null; rec.abort?.(); };
  }, []);

  useEffect(() => () => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    utteranceRef.current = null;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    if (!recRef.current || listening) return;
    stopSpeaking();
    bufferRef.current = "";
    interimRef.current = "";
    recRef.current.lang = loadVoicePrefs().accent || "en-US";
    setVoiceMode(true);
    setListening(true);
    try { recRef.current.start(); } catch { setListening(false); }
  }, [listening, stopSpeaking]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text, prefetchedUrl) => {
    if (!text || !speechSupported) return;
    stopSpeaking();
    setSpeaking(true);

    if (prefetchedUrl) {
      const audio = new Audio(prefetchedUrl);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); endCbRef.current?.(); };
      audio.onerror = () => setSpeaking(false);
      audio.play().catch(() => setSpeaking(false));
      return;
    }

    // High-quality AI-generated speech (same warm voice used before).
    const prefs = loadVoicePrefs();
    base44.integrations.Core.GenerateSpeech({
      text, voice: VOICE_BY_MOOD[prefs.mood] || "honey", language_code: "en",
    }).then(({ url }) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); endCbRef.current?.(); };
      audio.onerror = () => setSpeaking(false);
      audio.play().catch(() => setSpeaking(false));
    }).catch(() => setSpeaking(false));
  }, [stopSpeaking]);

  return { listening, speaking, voiceMode, setVoiceMode, startListening, stopListening, speak, stopSpeaking };
}