import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getPublicSettings } from "@/lib/captcha";
import AqlaLogo from "@/components/AqlaLogo";
import NeuralBrainVisual from "@/components/brainmap/NeuralBrainVisual";
import BrainHealthSummary from "@/components/brainmap/BrainHealthSummary";
import { DOMAINS } from "@/lib/scoring";

const DEMO_SCORES = { focus: 28, memory: 43, mental_energy: 57, stress_regulation: 71, sleep_recovery: 85, cognitive_resilience: 96, lifestyle_protection: 67, learning_capacity: 82 };
const DEMO_DOMAINS = DOMAINS.map((d) => ({ ...d, score: DEMO_SCORES[d.key] }));
import NeuralField from "@/components/landing/NeuralField";
import LandingSections from "@/components/landing/LandingSections";
import ScrollIndicator from "@/components/landing/ScrollIndicator";
import NarrativeScroll from "@/components/landing/NarrativeScroll";
import { ArrowRight, Zap } from "lucide-react";
import SignalPath from "@/components/landing/SignalPath";

const SCROLL_SECTIONS = ["The Problem", "The Signal", "The Protocol", "The Evidence", "Begin"];

const STEPS = [
  ["01", "Try three preview tasks", "Start the seven-part cognitive baseline with three short tasks. No account needed."],
  ["02", "Add your questionnaire", "Create an account, save those results, and capture your sleep, stress, rhythm, and habits."],
  ["03", "Complete your Brain Map", "Finish the four remaining measured tasks and combine them with your questionnaire."],
];

export default function Landing() {
  const [activeSection, setActiveSection] = useState(0);
  const stepRef = useRef(null);
  const [testMode, setTestMode] = useState(false);
  useEffect(() => {
    const urlTest = new URLSearchParams(window.location.search).get("test_mode") === "true";
    if (urlTest) { setTestMode(true); return; }
    getPublicSettings().then((s) => setTestMode(!!s.test_mode)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background aqla-glow relative aqla-grain">
      <SignalPath triggerRef={stepRef} />
      <ScrollIndicator sections={SCROLL_SECTIONS} activeIndex={activeSection} />
      <NeuralField className="opacity-60 h-[110vh]" />
      <header className="relative max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <AqlaLogo className="text-foreground" />
          <span className="hidden sm:inline ml-3 text-xs text-muted-foreground">Understand your brain. Improve your life.</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <AqlaLogo showWordmark={false} className="text-foreground hidden sm:flex" />
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">Sign in</Link>
          <Link to="/start" className="text-sm px-4 py-2 rounded-full border border-border hover:border-foreground/30 transition-colors text-foreground whitespace-nowrap">Get started</Link>
        </div>
      </header>

      <section className="relative max-w-6xl mx-auto px-4 md:px-6 pt-10 md:pt-24 pb-10 md:pb-12 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs">
            <Zap className="w-3.5 h-3.5" />
            New here? Try the first three of seven baseline tasks. No account needed.
          </motion.div>
          <h1 className="mt-6 text-3xl sm:text-4xl md:text-6xl font-light leading-[1.12] md:leading-[1.08] text-foreground">
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
            className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg">
            AQLA analyzes your cognitive performance, lifestyle, sleep, stress, habits, and goals to create a
            personalized brain-health protocol that continuously learns what works for you.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.2 }}
            className="mt-8 md:mt-10 flex flex-wrap gap-3 md:gap-4">
            <Link to="/start" className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-20 pointer-events-none" />
              Get Started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#science" className="inline-flex items-center px-7 py-3.5 rounded-full border border-border text-foreground hover:border-foreground/30 transition-colors">
              Explore the Science
            </a>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.4 }}>
          <NeuralBrainVisual key="landing-neural-brain" domains={DEMO_DOMAINS} />
          <div className="mt-3">
            <BrainHealthSummary domains={DEMO_DOMAINS} compact />
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Example Brain Map. Your questionnaire and seven measured tasks build your real profile.</p>
        </motion.div>
      </section>

      <section className="relative max-w-6xl mx-auto px-4 md:px-6 pb-14 md:pb-16">
        <div className="grid md:grid-cols-3 gap-3 md:gap-4">
          {STEPS.map(([num, title, desc], i) => (
            <motion.div key={num} ref={i === 0 ? stepRef : null} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: i * 0.15 }}
              className="aqla-panel rounded-2xl p-6">
              <p className="font-display text-primary/70 text-sm tabular-nums">{num}</p>
              <p className="mt-2 font-display text-foreground">{title}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
        {testMode && (
          <div className="mt-6 flex justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-6 py-3 text-sm text-primary hover:bg-primary/10 transition-colors">
              Skip to registration <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      <LandingSections />

      <NarrativeScroll onSectionEnter={setActiveSection} />

      <footer className="relative border-t border-border/70">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 AQLA. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
            <span>Neural wellness, not medical advice.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}