import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { localDateKey } from "@/lib/dateKey";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const FIELDS = [
  { key: "clarity", label: "How mentally clear do you feel?" },
  { key: "energy", label: "How is your energy?" },
  { key: "stress", label: "How is your stress?" },
  { key: "sleep_quality", label: "How well did you sleep?" },
];

const DEMANDS = ["Deep focused work", "Meetings & people", "Learning", "Creative work", "Recovery day"];

export default function CheckInDialog({ open, onOpenChange, onSaved }) {
  const [values, setValues] = useState({ clarity: 5, energy: 5, stress: 5, sleep_quality: 5 });
  const [demand, setDemand] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.DailyCheckIn.create({
      date: localDateKey(),
      ...values, demand, note,
    });
    setSaving(false);
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-normal text-xl">Daily check-in</DialogTitle>
        </DialogHeader>
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
          <button onClick={save} disabled={saving}
            className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
            {saving ? "Saving…" : "Complete check-in"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}