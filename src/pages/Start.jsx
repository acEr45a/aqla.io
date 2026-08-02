import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactionTest from "@/components/tests/ReactionTest";
import AttentionTest from "@/components/tests/AttentionTest";
import MemoryTest from "@/components/tests/MemoryTest";
import useHomePath from "@/lib/useHomePath";
import { Zap, Eye, Layers, ArrowRight, Check, X } from "lucide-react";

const TESTS = [
  { type: "reaction_time", name: "Reaction time", desc: "Respond the instant the signal appears.", icon: Zap, Component: ReactionTest },
  { type: "sustained_attention", name: "Sustained attention", desc: "Respond to every letter except X.", icon: Eye, Component: AttentionTest },
  { type: "memory_recall", name: "Digit Span", desc: "Wechsler Digit Span — forward and backward recall.", icon: Layers, Component: MemoryTest },
];

export default function Start() {
  const navigate = useNavigate();
  const homePath = useHomePath();
  const [phase, setPhase] = useState("intro"); // intro | testing | done
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState({});

  const onComplete = (test, { raw, score }) => {
    const next = { ...scores, [test.type]: { raw, score } };
    setScores(next);
    if (idx < TESTS.length - 1) {
      setIdx(idx + 1);
    } else {
      const records = TESTS.map((t) => ({
        test_type: t.type,
        raw_results: next[t.type].raw,
        normalized_score: next[t.type].score,
        completed_date: new Date().toISOString(),
        valid: true,
      }));
      localStorage.setItem("aqla_guest_tests", JSON.stringify(records));
      setPhase("done");
    }
  };

  if (phase === "testing") {
    const test = TESTS[idx];
    const C = test.Component;
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground tracking-widest uppercase">{test.name}</p>
            <div className="flex gap-1.5">
              {TESTS.map((t, i) => (
                <div key={t.type} className={`w-6 h-1 rounded-full ${i < idx ? "bg-primary" : i === idx ? "bg-primary/50" : "bg-secondary"}`} />
              ))}
            </div>
          </div>
          <Link to={homePath} aria-label="Exit" className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full h-full max-h-[70vh] flex items-center justify-center">
            <C key={test.type} onComplete={(r) => onComplete(test, r)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background aqla-glow flex items-center justify-center px-4 md:px-6 py-12">
      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-xl w-full">
            <p className="text-xs text-primary tracking-widest uppercase">Step 1 · Cognitive preview</p>
            <h1 className="mt-3 text-2xl sm:text-3xl md:text-5xl font-light text-foreground leading-tight">
              Begin with three of the seven baseline tasks.
            </h1>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              These three short tasks take about four minutes and measure speed, attention, and recall. After creating
              your account, they count automatically toward the full seven-task baseline. Your questionnaire measures
              sleep, stress, daily rhythm, habits, and goals.
            </p>
            <div className="mt-8 space-y-3">
              {TESTS.map((t, i) => (
                <motion.div key={t.type} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12 }}
                  className="aqla-panel rounded-2xl px-5 py-4 flex items-center gap-4">
                  <t.icon className="w-5 h-5 text-primary shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="mt-5 text-[11px] text-muted-foreground">Find a quiet spot — accuracy matters more than speed of setup.</p>
            <button onClick={() => setPhase("testing")}
              className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Begin preview task 1 of 3 <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15 }}
              className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
              <Check className="w-7 h-7 text-primary" />
            </motion.div>
            <h1 className="mt-6 text-3xl md:text-4xl font-light text-foreground">Preview captured.</h1>
            <div className="mt-8 grid grid-cols-3 gap-3 md:gap-6">
              {TESTS.map((t, i) => (
                <motion.div key={t.type} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }}>
                  <p className="font-display text-3xl md:text-4xl font-light text-foreground tabular-nums">{Math.round(scores[t.type].score)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.name}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted-foreground leading-relaxed">
              Next, create your account and complete the questionnaire. These three scores will be saved and count toward your seven-task baseline.
            </p>
            <button onClick={() => navigate("/register?returnTo=%2Fassessment")}
              className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Create my account <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}