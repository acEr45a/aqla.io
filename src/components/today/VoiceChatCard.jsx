import React from "react";
import { Link } from "react-router-dom";
import { Mic, Volume2 } from "lucide-react";
import { voiceSupported } from "@/lib/useVoiceChat";

export default function VoiceChatCard() {
  if (!voiceSupported) return null;
  return (
    <Link to="/coach"
      className="mt-8 block rounded-2xl border border-primary/25 bg-primary/5 p-6 hover:bg-primary/10 transition-colors">
      <p className="text-[11px] uppercase tracking-widest text-primary flex items-center gap-2">
        <Mic className="w-3.5 h-3.5" /> New — voice chat
      </p>
      <p className="mt-3 font-display text-lg text-foreground">Talk to AQLA Intelligence out loud</p>
      <p className="mt-1.5 text-xs text-muted-foreground max-w-lg leading-relaxed">
        Tap the microphone in AQLA Intelligence, ask your question by voice, and AQLA answers back out loud —
        still grounded only in your own Brain Map, check-ins and protocol data.
      </p>
      <p className="mt-4 inline-flex items-center gap-2 text-xs text-primary">
        <Volume2 className="w-3.5 h-3.5" /> Start a voice conversation
      </p>
    </Link>
  );
}