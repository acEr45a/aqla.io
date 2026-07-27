import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ReactionTest from "@/components/tests/ReactionTest";
import AttentionTest from "@/components/tests/AttentionTest";
import MemoryTest from "@/components/tests/MemoryTest";
import { Zap, Eye, Layers, Check, X } from "lucide-react";

const TESTS = [
  { type: "reaction_time", name: "Reaction time", desc: "Processing speed — respond the instant the signal appears.", icon: Zap, minutes: "~1 min", Component: ReactionTest },
  { type: "sustained_attention", name: "Sustained attention", desc: "Go/no-go — respond to every letter except X.", icon: Eye, minutes: "~1 min", Component: AttentionTest },
  { type: "memory_recall", name: "Short-term recall", desc: "Digit span — recall increasingly long sequences.", icon: Layers, minutes: "~2 min", Component: MemoryTest },
];

// Blend measured test scores into Brain Map domains: [domain_key, test_type, weight of test]
const BLEND = [
  ["focus", "sustained_attention", 0.35],
  ["focus", "reaction_time", 0.15],
  ["memory", "memory_recall", 0.5],
  ["learning_capacity", "memory_recall", 0.35],
  ["cognitive_resilience", "reaction_time", 0.3],
];

export default function CognitiveTests() {
  const [results, setResults] = useState(null); // { test_type: record }
  const [active, setActive] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const load = async () => {
    const rows = await base44.entities.CognitiveTest.list("-created_date");
    const latest = {};
    rows.forEach((r) => { if (!latest[r.test_type]) latest[r.test_type] = r; });
    setResults(latest);
    return latest;
  };
  useEffect(() => { load(); }, []);

  const allDone = results && TESTS.every((t) => results[t.type]);

  const applyToBrainMap = async (latest) => {
    setApplying(true);
    const domains = await base44.entities.BrainDomain.list("-updated_date");
    const byKey = {};
    domains.forEach((d) => { if (!byKey[d.domain_key]) byKey[d.domain_key] = d; });
    for (const [domainKey, testType, w] of BLEND) {
      const d = byKey[domainKey];
      const t = latest[testType];
      if (!d || !t) continue;
      const newScore = Math.round(d.score * (1 - w) + t.normalized_score * w);
      const sources = Array.from(new Set([...(d.data_sources || []), "Cognitive baseline tests"]));
      await base44.entities.BrainDomain.update(d.id, {
        score: newScore,
        confidence: "high",
        trend: newScore > d.score ? "up" : newScore < d.score ? "down" : d.trend,
        data_sources: sources,
      });
    }
    setApplying(false);
    setApplied(true);
  };

  const onTestComplete = async (test, { raw, score }) => {
    await base44.entities.CognitiveTest.create({
      test_type: test.type,
      raw_results: raw,
      normalized_score: score,
      completed_date: new Date().toISOString(),
      valid: true,
    });
    setActive(null);
    const latest = await load();
    if (TESTS.every((t) => latest[t.type]) && !applied) await applyToBrainMap(latest);
  };

  if (active) {
    const test = TESTS.find((t) => t.type === active);
    const C = test.Component;
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-6 py-5">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">{test.name}</p>
          <button onClick={() => setActive(null)} aria-label="Exit test" className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full h-full max-h-[70vh] flex items-center justify-center">
            <C onComplete={(r) => onTestComplete(test, r)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">Cognitive baseline</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">Measure, don't guess.</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-lg leading-relaxed">
        Three short tasks measure your actual performance. Complete them in a quiet environment. Results are revealed
        once all three are done, then blended into your Brain Map.
      </p>

      <div className="mt-10 space-y-3">
        {TESTS.map((t) => {
          const done = results?.[t.type];
          return (
            <div key={t.type} className="aqla-panel rounded-2xl px-6 py-5 flex items-center gap-5">
              <t.icon className="w-5 h-5 text-primary shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">{t.minutes}</span>
              {done ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-primary"><Check className="w-3.5 h-3.5" /> Recorded</span>
              ) : (
                <button onClick={() => setActive(t.type)}
                  className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
                  Start
                </button>
              )}
            </div>
          );
        })}
      </div>

      {results && !allDone && Object.keys(results).length > 0 && (
        <p className="mt-6 text-xs text-muted-foreground">
          Results stay hidden until all three tests are complete — this keeps your baseline unbiased.
        </p>
      )}

      {applying && <p className="mt-8 text-sm text-muted-foreground">Updating your Brain Map with measured scores…</p>}

      {allDone && !applying && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 aqla-panel rounded-3xl p-8">
          <p className="text-xs uppercase tracking-widest text-primary">Baseline complete</p>
          <div className="mt-6 grid grid-cols-3 gap-6">
            {TESTS.map((t) => (
              <div key={t.type}>
                <p className="font-display text-4xl font-light text-foreground tabular-nums">{Math.round(results[t.type].normalized_score)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.name}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
            Your measured scores have been blended into Focus, Memory, Learning Capacity, and Cognitive Resilience on
            your Brain Map — with confidence raised to high.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="/map" className="px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium">View Brain Map</a>
            <button onClick={() => { setApplied(false); setResults({}); }}
              className="px-6 py-3 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Retake baseline
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}