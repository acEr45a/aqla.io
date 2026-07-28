import React from "react";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const SCALES = [
  ["overall", "How do you feel overall after this plan?"],
  ["focus", "How much did your focus improve?"],
  ["recovery", "How much did your energy and recovery improve?"],
];

export default function ReviewSurvey({ values, onChange, onSubmit, loading }) {
  const update = (key, value) => onChange({ ...values, [key]: value });
  return (
    <div className="space-y-7">
      {SCALES.map(([key, label]) => (
        <div key={key}>
          <div className="mb-3 flex justify-between text-sm"><span>{label}</span><span className="text-primary">{values[key]}/10</span></div>
          <Slider value={[values[key]]} min={1} max={10} step={1} onValueChange={([value]) => update(key, value)} />
        </div>
      ))}
      <Textarea value={values.reflection} onChange={(event) => update("reflection", event.target.value)} placeholder="What changed most during these 14 check-ins?" rows={3} />
      <Textarea value={values.side_effects} onChange={(event) => update("side_effects", event.target.value)} placeholder="Any side effects or concerns?" rows={2} />
      <button onClick={onSubmit} disabled={loading || !values.reflection.trim()} className="w-full rounded-full bg-primary py-3.5 font-medium text-primary-foreground disabled:opacity-40">
        {loading ? "AQLA is reviewing…" : "Review my results"}
      </button>
    </div>
  );
}