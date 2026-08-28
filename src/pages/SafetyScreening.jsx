import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/api/apiClient";
import { SCREENING_QUESTIONS, STATUS_META, evaluateEligibility } from "@/lib/safety";
import { Shield, ArrowRight, ArrowLeft } from "lucide-react";

export default function SafetyScreening() {
  const navigate = useNavigate();
  const [step, setStep] = useState(-1);
  const [responses, setResponses] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const answer = async (id, value) => {
    const next = { ...responses, [id]: value };
    setResponses(next);
    if (step < SCREENING_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setSaving(true);
      const evald = evaluateEligibility(next);
      await apiClient.entities.HealthProfile.create({
        responses: next,
        eligibility_status: evald.status,
        flags: evald.flags,
        completed_date: new Date().toISOString(),
      });
      setSaving(false);
      setResult(evald);
    }
  };

  if (result) {
    const meta = STATUS_META[result.status];
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="aqla-panel rounded-3xl p-8 md:p-10">
          <Shield className="w-8 h-8 mb-5" style={{ color: meta.color }} strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Eligibility result</p>
          <h1 className="mt-2 text-2xl md:text-3xl font-light" style={{ color: meta.color }}>{meta.label}</h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{meta.message}</p>
          {result.flags.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-2">Factors detected</p>
              <div className="flex flex-wrap gap-2">
                {result.flags.map((f) => (
                  <span key={f} className="px-3 py-1.5 rounded-full bg-secondary text-xs text-foreground/80">{f}</span>
                ))}
              </div>
            </div>
          )}
          <p className="mt-8 text-[11px] text-muted-foreground leading-relaxed">
            This is a deterministic safety screen, not a medical assessment. The AI coach cannot override this result.
          </p>
          <button onClick={() => navigate("/protocols")}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium">
            View protocol eligibility <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === -1) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link to="/settings"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to settings
        </Link>
        <p className="text-xs text-muted-foreground tracking-widest uppercase">Safety screening</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">Before any formula, safety comes first.</h1>
        <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-lg">
          Ten quick questions determine which protocol families are appropriate for you. Fixed safety rules — not AI —
          make this decision. Your answers stay private.
        </p>
        <button onClick={() => setStep(0)}
          className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
          Begin screening <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const q = SCREENING_QUESTIONS[step];
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex gap-1 mb-10">
        {SCREENING_QUESTIONS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
          <p className="text-xs text-muted-foreground tabular-nums">{step + 1} / {SCREENING_QUESTIONS.length}</p>
          <h2 className="mt-3 text-xl md:text-2xl font-light text-foreground leading-snug">{q.question}</h2>
          <div className="mt-8 space-y-3">
            {q.options.map((o) => (
              <button key={o.value} disabled={saving} onClick={() => answer(q.id, o.value)}
                className="w-full text-left px-5 py-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-sm text-foreground/90 disabled:opacity-50">
                {o.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <Link to="/protocols" className="block mt-10 text-xs text-muted-foreground hover:text-foreground">Cancel</Link>
    </div>
  );
}