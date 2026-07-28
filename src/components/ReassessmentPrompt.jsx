import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const CYCLE_MS = 14 * 24 * 60 * 60 * 1000;

export default function ReassessmentPrompt() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let timer;
    base44.entities.Assessment.list("-completed_date", 1).then(([latest]) => {
      if (!latest) return;
      const completedAt = new Date(latest.completed_date || latest.created_date).getTime();
      const remaining = completedAt + CYCLE_MS - Date.now();
      if (remaining <= 0) setOpen(true);
      else timer = window.setTimeout(() => setOpen(true), remaining);
    });
    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 px-5 backdrop-blur-sm">
      <div className="aqla-panel w-full max-w-md rounded-3xl p-8">
        <p className="text-xs uppercase tracking-widest text-primary">14-day reassessment</p>
        <h2 className="mt-3 text-2xl font-light text-foreground">Your next check-in is ready.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Fourteen full days have passed since your last questionnaire. Retake it now, then complete the cognitive tests again to refresh your Brain Map.</p>
        <div className="mt-7 flex gap-3">
          <button onClick={() => navigate("/assessment")} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Retake questionnaire</button>
          <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-3 text-sm text-muted-foreground">Later</button>
        </div>
      </div>
    </div>
  );
}