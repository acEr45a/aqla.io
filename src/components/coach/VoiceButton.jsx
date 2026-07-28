import React from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

export default function VoiceButton({ listening, speaking, onStartListening, onStopListening, onStopSpeaking }) {
  if (speaking) {
    return (
      <button type="button" onClick={onStopSpeaking} aria-label="Stop AQLA's voice"
        className="w-10 h-10 rounded-full border border-primary/40 text-primary flex items-center justify-center">
        <VolumeX className="w-4 h-4" />
      </button>
    );
  }
  return (
    <button type="button" onClick={listening ? onStopListening : onStartListening}
      aria-label={listening ? "Stop listening" : "Speak to AQLA"}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
        listening ? "bg-primary text-primary-foreground animate-pulse" : "border border-border text-muted-foreground hover:text-foreground"}`}>
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}

export function VoiceStatus({ listening, speaking }) {
  if (!listening && !speaking) return null;
  return (
    <p className="flex items-center gap-2 text-xs text-primary">
      {speaking ? <Volume2 className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      {speaking ? "AQLA is speaking…" : "Listening…"}
    </p>
  );
}