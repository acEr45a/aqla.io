import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import BrainVisual from "@/components/brainmap/BrainVisual";
import { DOMAINS } from "@/lib/scoring";

const DEMO_SCORES = { focus: 62, memory: 74, mental_energy: 58, stress_regulation: 47, sleep_recovery: 66, cognitive_resilience: 71, lifestyle_protection: 79, learning_capacity: 68 };
const DEMO_DOMAINS = DOMAINS.map((d) => ({ ...d, score: DEMO_SCORES[d.key] }));
import NeuralField from "@/components/landing/NeuralField";
import LandingSections from "@/components/landing/LandingSections";
import { ArrowRight, Zap } from "lucide-react";

const STEPS = [
  ["01", "Try three preview tasks", "Start the seven-part cognitive baseline with three short tasks—no account needed."],
  ["02", "Add your questionnaire", "Create an account, save those results, and capture your sleep, stress, rhythm, and habits."],
  ["03", "Complete your Brain Map", "Finish the four remaining measured tasks and combine them with your questionnaire."],
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background aqla-glow relative aqla-grain">
      <NeuralField className="opacity-60 h-[110vh]" />
      <header className="relative max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div>
          <span className="font-display text-xl tracking-tight text-foreground">AQLA</span>
          <span className="hidden sm:inline ml-3 text-xs text-muted-foreground">Understand your brain. Improve your life.</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">Sign in</Link>
          <Link to="/start" className="text-sm px-4 py-2 rounded-full border border-border hover:border-foreground/30 transition-colors text-foreground">Get started</Link>
        </div>
      </header>

      <section className="relative max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-12 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs">
            <Zap className="w-3.5 h-3.5" />
            New here? Try the first three of seven baseline tasks — no account needed.
          </motion.div>
          <h1 className="mt-6 text-4xl md:text-6xl font-light leading-[1.08] text-foreground">
            {"Your brain is giving you signals.".split(" ").map((word, i) => (
              <motion.span key={i} className="inline-block mr-[0.25em]"
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }}>
                {word}
              </motion.span>
            ))}
            <motion.span className="text-primary inline-block"
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.75 }}>
              AQLA helps you understand them.
            </motion.span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1 }}
            className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-lg">
            AQLA analyzes your cognitive performance, lifestyle, sleep, stress, habits, and goals to create a
            personalized brain-health protocol that continuously learns what works for you.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.2 }}
            className="mt-10 flex flex-wrap gap-4">
            <Link to="/start" className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-20 pointer-events-none" />
              Discover Your Cognitive Profile <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#science" className="inline-flex items-center px-7 py-3.5 rounded-full border border-border text-foreground hover:border-foreground/30 transition-colors">
              Explore the Science
            </a>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.4 }}>
          <BrainVisual domains={DEMO_DOMAINS} />
          <p className="mt-1 text-center text-[11px] text-muted-foreground">Example Brain Map — your questionnaire and seven measured tasks build your real profile.</p>
        </motion.div>
      </section>

      <section className="relative max-w-6xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map(([num, title, desc], i) => (
            <motion.div key={num} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: i * 0.15 }}
              className="aqla-panel rounded-2xl p-6">
              <p className="font-display text-primary/70 text-sm tabular-nums">{num}</p>
              <p className="mt-2 font-display text-foreground">{title}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <LandingSections />
    </div>
  );
}