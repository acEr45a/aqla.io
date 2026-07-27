import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CHAPTERS } from "@/lib/assessmentData";
import { DOMAINS } from "@/lib/scoring";
import RadialMap from "@/components/brainmap/RadialMap";
import { ArrowRight, ArrowLeft } from "lucide-react";

function Scale({ value, onChange, low, high }) {
  return (
    <div>
      <div className="flex gap-1.5 md:gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={() => onChange(n)} aria-label={`${n} of 10`}
            className={`flex-1 h-11 rounded-lg border text-sm tabular-nums transition-all ${
              value === n ? "bg-primary text-primary-foreground border-primary font-semibold"
                : n <= (value || 0) ? "bg-primary/15 border-primary/30 text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/30"}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{low}</span><span>{high}</span>
      </div>
    </div>
  );
}

function Choice({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-5 py-3 rounded-full border text-sm transition-all ${
            value === o.value ? "bg-foreground text-background border-foreground font-medium"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Assessment() {
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(0);
  const [responses, setResponses] = useState({});
  const [saving, setSaving] = useState(false);
  const ch = CHAPTERS[chapter];

  const litDomains = new Set(CHAPTERS.slice(0, chapter).flatMap((c) => c.domains));
  const mapDomains = DOMAINS.map((d) => ({ ...d, score: litDomains.has(d.key) ? 60 : 20, label: d.label }));

  const answered = ch.questions.every((q) => responses[q.key] != null);

  const next = async () => {
    if (chapter < CHAPTERS.length - 1) { setChapter(chapter + 1); return; }
    setSaving(true);
    await base44.entities.Assessment.create({ responses, completed_date: new Date().toISOString(), version: "1.0" });
    navigate("/analysis");
  };

  return (
    <div className="min-h-screen bg-background aqla-glow">
      <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-[1fr_320px] gap-16">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            Chapter {chapter + 1} of {CHAPTERS.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.div key={ch.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}>
              <h1 className="mt-3 text-3xl md:text-4xl font-light text-foreground">{ch.title}</h1>
              <p className="mt-2 text-muted-foreground">{ch.subtitle}</p>
              <div className="mt-10 space-y-10">
                {ch.questions.map((q) => (
                  <div key={q.key}>
                    <p className="text-foreground mb-4 leading-relaxed">{q.label}</p>
                    {q.type === "scale" ? (
                      <Scale value={responses[q.key]} onChange={(v) => setResponses({ ...responses, [q.key]: v })} low={q.low} high={q.high} />
                    ) : (
                      <Choice value={responses[q.key]} onChange={(v) => setResponses({ ...responses, [q.key]: v })} options={q.options} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-12 flex items-center justify-between">
            <button onClick={() => (chapter > 0 ? setChapter(chapter - 1) : navigate("/"))}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={next} disabled={!answered || saving}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-30 transition-all hover:opacity-90">
              {saving ? "Saving…" : chapter === CHAPTERS.length - 1 ? "Analyze my brain" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="hidden lg:block sticky top-10 self-start">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-4">Your map is forming</p>
          <RadialMap domains={mapDomains} size={320} />
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Each completed chapter illuminates a new domain of your Brain Health Map.
          </p>
        </div>
      </div>
    </div>
  );
}