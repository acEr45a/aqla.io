import { useEffect, useState } from "react";

const KEY = "aqla_voice_prefs";

export const ACCENTS = [
  { id: "en-GB", label: "British", langs: ["en-GB"] },
  { id: "en-US", label: "American", langs: ["en-US"] },
  { id: "en-AU", label: "Australian", langs: ["en-AU"] },
  { id: "en-IN", label: "Indian", langs: ["en-IN"] },
];

export const MOODS = [
  { id: "calm", label: "Calm", rate: 0.88, pitch: 0.95 },
  { id: "neutral", label: "Neutral", rate: 1, pitch: 1 },
  { id: "focused", label: "Focused", rate: 1.12, pitch: 1.05 },
  { id: "warm", label: "Warm", rate: 0.95, pitch: 1.15 },
];

export const defaultPrefs = { accent: "en-GB", mood: "calm" };

export function loadVoicePrefs() {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...defaultPrefs };
  }
}

export function saveVoicePrefs(prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("aqla:voice-prefs"));
}

// Shared reactive access to the user's accent + mood choice.
export function useVoicePrefs() {
  const [prefs, setPrefs] = useState(loadVoicePrefs);

  useEffect(() => {
    const sync = () => setPrefs(loadVoicePrefs());
    window.addEventListener("aqla:voice-prefs", sync);
    return () => window.removeEventListener("aqla:voice-prefs", sync);
  }, []);

  const update = (patch) => {
    const next = { ...loadVoicePrefs(), ...patch };
    saveVoicePrefs(next);
    setPrefs(next);
  };

  return { prefs, update };
}

export function pickVoice(accentId) {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return null;
  const accent = ACCENTS.find((a) => a.id === accentId) || ACCENTS[0];
  return (
    voices.find((v) => accent.langs.includes(v.lang)) ||
    voices.find((v) => accent.langs.some((l) => v.lang?.startsWith(l.slice(0, 2)))) ||
    voices[0]
  );
}

export function moodOf(moodId) {
  return MOODS.find((m) => m.id === moodId) || MOODS[1];
}