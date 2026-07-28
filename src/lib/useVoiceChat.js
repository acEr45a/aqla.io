import { useCallback, useEffect, useRef, useState } from "react";

const Recognition = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export const voiceSupported = !!Recognition && typeof window !== "undefined" && "speechSynthesis" in window;

// Browser-native speech in + speech out for AQLA Intelligence.
export default function useVoiceChat({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const recRef = useRef(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;

  useEffect(() => {
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = "en-US";
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
    setVoiceMode(true);
    setListening(true);
    recRef.current.start();
  }, [listening]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.98;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { listening, speaking, voiceMode, setVoiceMode, startListening, stopListening, speak, stopSpeaking };
}