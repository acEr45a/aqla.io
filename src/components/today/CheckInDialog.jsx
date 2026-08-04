import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { localDateKey } from "@/lib/dateKey";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import VoiceCheckIn from "@/components/today/VoiceCheckIn";
import { Sliders, MessageCircle } from "lucide-react";

const FIELDS = [
  { key: "clarity", label: "How mentally clear do you feel?" },
  { key: "energy", label: "How is your energy?" },
  { key: "stress", label: "How is your stress?" },
  { key: "sleep_quality", label: "How well did you sleep?" },
];

const DEMANDS = ["Deep focused work", "Meetings & people", "Learning", "Creative work", "Recovery day"];


export default function CheckInDialog({ open, onOpenChange, onSaved }) {
  const [mode, setMode] = useState("form");
  const [values, setValues] = useState({ clarity: 5, energy: 5, stress: 5, sleep_quality: 5 });
  const [caffeineDrinks, setCaffeineDrinks] = useState("");
  const [caffeineTime, setCaffeineTime] = useState("");
  const [demand, setDemand] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (payload) => {
    setSaving(true);
    setError("");
    try {
      await base44.entities.DailyCheckIn.create({
        date: localDateKey(),
        clarity: 5, energy: 5, stress: 5, sleep_quality: 5,
        caffeine_drinks: "", caffeine_last_time: "", demand: "", note: "",
        ...payload,
      });
      onOpenChange(false);
      onSaved?.();
      window.dispatchEvent(new Event("aqla:check-in-saved"));
    } catch (err) {
      setError(err?.message || "Could not save your check-in. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveForm = () => save({
    ...values, caffeine_drinks: caffeineDrinks, caffeine_last_time: caffeineTime, demand, note,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-normal text-xl">Daily check-in</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 p-1 rounded-full bg-secondary/60 border border-border">
          <button onClick={() => setMode("form")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs transition-colors ${
              mode === "form" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
            <Sliders className="w-3.5 h-3.5" /> Sliders
          </button>
          <button onClick={() => setMode("voice")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs transition-colors ${
              mode === "voice" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
            <MessageCircle className="w-3.5 h-3.5" /> Talk to AQLA
          </button>
        </div>

        {mode === "voice" ? (
          <VoiceCheckIn onComplete={(vals) => save(vals)} onCancel={() => setMode("form")} />
        ) : (
        <div className="space-y-6 py-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-foreground">{f.label}</span>
                <span className="tabular-nums text-primary font-medium">{values[f.key]}</span>
              </div>
              <Slider value={[values[f.key]]} min={1} max={10} step={1}
                onValueChange={([v]) => setValues({ ...values, [f.key]: v })} />
            </div>
          ))}
          <div>
            <p className="text-sm text-foreground mb-3">What caffeinated drinks did you have today?</p>
            <Textarea value={caffeineDrinks} onChange={(e) => setCaffeineDrinks(e.target.value)}
              placeholder="e.g. two double espressos, one green tea, a Red Bull in the afternoon"
              className="bg-secondary/50 border-border text-sm" rows={2} />
            <p className="mt-2 text-xs text-muted-foreground">Describe it in your own words — AQLA Intelligence will interpret the type, amount, and timing.</p>
            {caffeineDrinks.trim() && (
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Time of last caffeine</span>
                <input type="time" value={caffeineTime} onChange={(e) => setCaffeineTime(e.target.value)}
                  className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-foreground mb-3">What is the main demand on your brain today?</p>
            <div className="flex flex-wrap gap-2">
              {DEMANDS.map((d) => (
                <button key={d} onClick={() => setDemand(d)}
                  className={`px-3.5 py-2 rounded-full border text-xs transition-all ${
                    demand === d ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note — side effects, context, anything unusual…"
            className="bg-secondary/50 border-border text-sm" rows={2} />
          <button onClick={saveForm} disabled={saving}
            className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
            {saving ? "Saving…" : "Complete check-in"}
          </button>
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
        </div>
        )}
        {error && mode === "voice" && <p className="text-xs text-destructive text-center">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}