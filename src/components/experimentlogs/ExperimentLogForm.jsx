import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localDateKey } from "@/lib/dateKey";

export const VARIABLES = [
  "Caffeine timing", "Caffeine amount", "Morning light exposure", "Evening screen exposure",
  "Sleep timing", "Exercise", "Hydration", "Meal timing", "Supplement", "Meditation", "Other",
];

const EFFECTS = [
  { value: "better", label: "Performed better" },
  { value: "same", label: "No clear change" },
  { value: "worse", label: "Performed worse" },
];

export default function ExperimentLogForm({ onSaved }) {
  const [form, setForm] = useState({ date: localDateKey(), variable: VARIABLES[0], detail: "", timing: "", perceived_effect: "same", note: "" });
  const [saving, setSaving] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.ExperimentLog.create(form);
    setSaving(false);
    setForm((f) => ({ ...f, detail: "", timing: "", note: "" }));
    onSaved?.();
  };

  return (
    <form onSubmit={submit} className="aqla-panel rounded-2xl p-5 md:p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Date</label>
          <Input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Variable</label>
          <Select value={form.variable} onValueChange={(v) => set({ variable: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{VARIABLES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">What exactly did you do?</label>
          <Input value={form.detail} placeholder="e.g. 200mg coffee, no second cup"
            onChange={(e) => set({ detail: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Timing</label>
          <Input value={form.timing} placeholder="e.g. 07:30, or 2h before bed"
            onChange={(e) => set({ timing: e.target.value })} className="mt-1.5" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Perceived effect on that day's performance</label>
        <Select value={form.perceived_effect} onValueChange={(v) => set({ perceived_effect: v })}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{EFFECTS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Notes (optional)</label>
        <Textarea value={form.note} rows={3} placeholder="Context that might explain the result — workload, illness, travel…"
          onChange={(e) => set({ note: e.target.value })} className="mt-1.5" />
      </div>
      <Button type="submit" disabled={saving} className="rounded-full">{saving ? "Saving…" : "Log entry"}</Button>
    </form>
  );
}