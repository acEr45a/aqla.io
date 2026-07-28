import React from "react";
import { Volume2 } from "lucide-react";
import { ACCENTS, MOODS, useVoicePrefs } from "@/lib/voicePrefs";

function Chips({ items, active, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onPick(item.id)}
          className={`px-3.5 py-1.5 rounded-full border text-xs transition-colors ${
            active === item.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default function VoiceSettings({ onPreview }) {
  const { prefs, update } = useVoicePrefs();

  return (
    <div className="aqla-panel rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">AQLA voice</p>
        <button type="button" onClick={() => onPreview?.("This is how AQLA Intelligence will sound when it speaks to you.")}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          <Volume2 className="w-3.5 h-3.5" /> Preview
        </button>
      </div>
      <div className="mt-4">
        <p className="text-[13px] text-foreground mb-2">Accent</p>
        <Chips items={ACCENTS} active={prefs.accent} onPick={(accent) => update({ accent })} />
      </div>
      <div className="mt-5">
        <p className="text-[13px] text-foreground mb-2">Mood</p>
        <Chips items={MOODS} active={prefs.mood} onPick={(mood) => update({ mood })} />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[13px] text-foreground">Speak replies aloud</p>
        <button type="button" onClick={() => update({ speakReplies: !prefs.speakReplies })}
          className={`px-3.5 py-1.5 rounded-full border text-xs transition-colors ${
            prefs.speakReplies ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
          {prefs.speakReplies ? "On" : "Off"}
        </button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Available accents depend on the voices installed on your device.</p>
    </div>
  );
}