import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { getPublicSettings } from "@/lib/captcha";
import AqlaLogo from "@/components/AqlaLogo";
import { DOMAINS } from "@/lib/scoring";
import { ArrowRight, Zap, ChevronDown } from "lucide-react";
import { LocoScrollProvider } from "@/lib/LocoScrollProvider";

// ── Lazy heavy chunks ──────────────────────────────────────────────────────
const NeuralBrainVisual = lazy(() => import("@/components/brainmap/NeuralBrainVisual"));
const LandingSections = lazy(() => import("@/components/landing/LandingSections"));
const NarrativeScroll = lazy(() => import("@/components/landing/NarrativeScroll"));
const FloatingHudCards = lazy(() => import("@/components/landing/FloatingHudCards"));
const DomainHolographicExplorer = lazy(() => import("@/components/landing/DomainHolographicExplorer"));

function VisualFallback({ className = "aspect-square" }) {
  return (
    <div className={`${className} w-full rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse`} />
  );
}

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_SCORES = {
  focus: 28, memory: 43, mental_energy: 57, stress_regulation: 71,
  sleep_recovery: 85, cognitive_resilience: 96, lifestyle_protection: 67, learning_capacity: 82,
};
const DEMO_DOMAINS = DOMAINS.map((d) => ({ ...d, score: DEMO_SCORES[d.key] }));

// ── 4-Phase pinned narrative steps ─────────────────────────────────────────
const PHASES = [
  {
    phase: 1,
    tag: "The Noise",
    headline: "Your cognition is already broadcasting.",
    sub: "Reaction latency variance. Sleep debt accumulation. Chronic cortisol spikes. AQLA begins by listening to the signal your brain is already emitting.",
    color: "#F2C04E",
  },
  {
    phase: 2,
    tag: "The Calibration",
    headline: "Seven psychometric tasks. Rigorous science.",
    sub: "PVT-B reaction speed. Wechsler Digit Span memory. SART sustained attention. Each task is a validated psychometric instrument from peer-reviewed neuroscience.",
    color: "#5FD4E8",
  },
  {
    phase: 3,
    tag: "The Brain Map",
    headline: "Eight neural domains. One integrated picture.",
    sub: "Focus. Memory. Resilience. Energy. Sleep. Stress. Lifestyle. Learning. Synthesized into a live neural map with domain-level precision.",
    color: "#bef264",
  },
  {
    phase: 4,
    tag: "The Protocol",
    headline: "Targeted interventions. Evidence-informed.",
    sub: "Circadian staging protocols. Targeted supplementation windows. Behavioral stack sequences — all calibrated to your unique neural fingerprint.",
    color: "#A78BFA",
  },
];

// ── Steps ──────────────────────────────────────────────────────────────────
const STEPS = [
  ["01", "Try three preview tasks", "Start the seven-part cognitive baseline with three short tasks. No account needed."],
  ["02", "Add your questionnaire", "Create an account, save your results, and capture sleep, stress, rhythm, and habits."],
  ["03", "Complete your Brain Map", "Finish the remaining tasks and combine them with your questionnaire into a live neural map."],
];

const SCROLL_SECTIONS = ["The Problem", "The Signal", "The Protocol", "The Evidence", "Begin"];

// ── Animated terminal badge ─────────────────────────────────────────────────
function TerminalBadge() {
  const phrases = ["COGNITIVE TELEMETRY READY", "BRAIN MAP CALIBRATING", "PROTOCOL ENGINE ACTIVE", "NEURAL FINGERPRINT DETECTED"];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % phrases.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#bef264]/30 bg-[#bef264]/5 text-[#bef264] text-xs font-mono"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#bef264] animate-pulse" />
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="uppercase tracking-widest"
        >
          AQLA OS v2.4 &nbsp;// &nbsp;{phrases[idx]}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Scroll-pinned narrative section ────────────────────────────────────────
function PinnedNarrative() {
  const containerRef = useRef(null);
  const [activePhase, setActivePhase] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsub = scrollYProgress.onChange(v => {
      const idx = Math.min(PHASES.length - 1, Math.floor(v * PHASES.length));
      setActivePhase(idx);
    });
    return unsub;
  }, [scrollYProgress]);

  const phase = PHASES[activePhase];

  return (
    <section ref={containerRef} className="relative" style={{ height: `${PHASES.length * 100}vh` }}>
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        {/* Background gradient shifts with phase */}
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 60% 50%, ${phase.color}08 0%, transparent 70%)`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Narrative text */}
          <div>
            {/* Phase step indicators */}
            <div className="flex gap-2 mb-8">
              {PHASES.map((p, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: i === activePhase ? phase.color : "rgba(255,255,255,0.1)",
                    boxShadow: i === activePhase ? `0 0 8px ${phase.color}` : "none",
                  }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activePhase}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono uppercase tracking-widest mb-5"
                  style={{ borderColor: `${phase.color}40`, color: phase.color, backgroundColor: `${phase.color}08` }}
                >
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: phase.color }} />
                  Phase {phase.phase} — {phase.tag}
                </div>
                <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-6">
                  {phase.headline}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                  {phase.sub}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Scroll hint */}
            <motion.div
              className="mt-12 flex items-center gap-2 text-white/20 text-xs"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-4 h-4" />
              <span className="font-mono uppercase tracking-widest">Scroll to continue</span>
            </motion.div>
          </div>

          {/* Right: 3D Brain Visual */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-3xl transition-all duration-1000"
              style={{ backgroundColor: `${phase.color}12` }}
            />
            <Suspense fallback={<VisualFallback />}>
              <NeuralBrainVisual key="pinned-brain" domains={DEMO_DOMAINS} />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Cyber gridline background ──────────────────────────────────────────────
function CyberGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#bef264" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// ── Main Landing page ──────────────────────────────────────────────────────
export default function Landing() {
  const [activeSection, setActiveSection] = useState(0);
  const [testMode, setTestMode] = useState(false);
  const stepRef = useRef(null);

  useEffect(() => {
    const urlTest = new URLSearchParams(window.location.search).get("test_mode") === "true";
    if (urlTest) { setTestMode(true); return; }
    getPublicSettings().then((s) => setTestMode(!!s.test_mode)).catch(() => {});
  }, []);

  return (
    <LocoScrollProvider>
      <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden aqla-grain">
      <CyberGrid />

      {/* ──────────────────────────────────────────
          NAV
      ────────────────────────────────────────── */}
      <header className="relative z-30 max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AqlaLogo className="text-foreground" />
          <span className="hidden md:inline text-xs text-muted-foreground font-mono uppercase tracking-wider ml-3">
            Cognitive Operating System
          </span>
        </div>
        <nav className="flex items-center gap-1 sm:gap-3 shrink-0">
          <a href="#domains" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">Domains</a>
          <a href="#science" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">Science</a>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">Sign in</Link>
          <Link
            to="/start"
            className="relative text-sm px-5 py-2.5 rounded-full font-semibold overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #bef264, #a3e635)",
              color: "#000",
              boxShadow: "0 0 24px #bef26430",
            }}
          >
            <span className="relative z-10">Get started</span>
          </Link>
        </nav>
      </header>

      {/* ──────────────────────────────────────────
          HERO
      ────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-16 pb-16 flex items-center">
        {/* Radial glow behind brain */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #bef26415 0%, #5FD4E810 40%, transparent 70%)" }} />

        <div className="relative w-full grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* ── Left: Copy ── */}
          <div className="relative z-10">
            <TerminalBadge />

            <h1 className="mt-8 text-4xl sm:text-5xl md:text-[4.5rem] font-light leading-[1.06] text-white">
              {"Your brain is giving".split(" ").map((word, i) => (
                <motion.span key={i} className="inline-block mr-[0.22em]"
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }}>
                  {word}
                </motion.span>
              ))}
              <br />
              <motion.span
                className="inline-block mr-[0.22em]"
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                you
              </motion.span>
              <motion.span
                className="relative inline-block"
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.85 }}
                style={{ color: "#bef264", textShadow: "0 0 40px #bef26450" }}
              >
                signals.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="mt-6 text-base md:text-xl text-muted-foreground leading-relaxed max-w-xl"
            >
              AQLA is a personalized mental performance platform that maps 8 neural domains using
              validated psychometric science — and builds a protocol stack that&apos;s uniquely yours.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.35 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                to="/start"
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold overflow-hidden text-black"
                style={{ background: "linear-gradient(135deg, #bef264, #a3e635)", boxShadow: "0 0 32px #bef26440" }}
              >
                <span className="absolute inset-0 rounded-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10">Start for free</span>
                <ArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#domains"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-white/80 hover:border-white/20 hover:text-white transition-all"
              >
                Explore domains
              </a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              {["7 validated psychometric tasks", "8 cognitive domains", "Evidence-informed protocols", "No wearable needed"].map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#bef264]/60" />
                  {s}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── Right: 3D Brain Stage ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.3 }}
            className="relative"
          >
            {/* HUD Cards overlay */}
            <div className="absolute inset-0 z-10">
              <Suspense fallback={null}>
                <FloatingHudCards />
              </Suspense>
            </div>

            {/* Glass border frame */}
            <div
              className="relative rounded-3xl overflow-hidden border"
              style={{
                borderColor: "rgba(190,242,100,0.1)",
                boxShadow: "0 0 80px rgba(190,242,100,0.08), inset 0 0 40px rgba(0,0,0,0.4)",
                background: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Top accent */}
              <div className="absolute top-0 left-8 right-8 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(190,242,100,0.5), transparent)" }} />
              <Suspense fallback={<VisualFallback className="aspect-square" />}>
                <NeuralBrainVisual key="hero-brain" domains={DEMO_DOMAINS} />
              </Suspense>
            </div>

            {/* Example tag */}
            <p className="mt-3 text-center text-[11px] text-muted-foreground font-mono">
              DEMO BRAIN MAP · Your real map is built from your 7 tasks + questionnaire
            </p>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          3-STEP GET STARTED
      ────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-mono uppercase tracking-widest text-[#bef264]/70 mb-3"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-light text-white"
          >
            Three steps. <span className="text-[#bef264]">Infinite precision.</span>
          </motion.h2>
        </div>

        <div ref={stepRef} className="grid md:grid-cols-3 gap-4">
          {STEPS.map(([num, title, desc], i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative p-6 rounded-2xl border backdrop-blur-xl overflow-hidden group"
              style={{
                borderColor: "rgba(190,242,100,0.08)",
                backgroundColor: "rgba(0,0,0,0.3)",
              }}
            >
              <div className="absolute top-0 left-4 right-4 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(190,242,100,0.3), transparent)" }} />
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "#bef26410" }} />
              <p className="font-mono text-[#bef264]/50 text-sm tabular-nums mb-3">{num}</p>
              <p className="text-white font-medium text-base mb-2">{title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {testMode && (
          <div className="mt-8 flex justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full border border-[#bef264]/30 bg-[#bef264]/5 px-6 py-3 text-sm text-[#bef264] hover:bg-[#bef264]/10 transition-colors">
              Skip to registration <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────
          PINNED SCROLL NARRATIVE
      ────────────────────────────────────────── */}
      <PinnedNarrative />

      {/* ──────────────────────────────────────────
          8-DOMAIN HOLOGRAPHIC EXPLORER
      ────────────────────────────────────────── */}
      <section id="domains" className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: "radial-gradient(circle, #bef26408 0%, transparent 70%)" }} />
        </div>
        <Suspense fallback={<VisualFallback className="h-96" />}>
          <DomainHolographicExplorer />
        </Suspense>
      </section>

      {/* ──────────────────────────────────────────
          LANDING SECTIONS (Science / Evidence)
      ────────────────────────────────────────── */}
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 md:px-6"><VisualFallback className="h-64" /></div>}>
        <LandingSections />
      </Suspense>

      {/* ──────────────────────────────────────────
          NARRATIVE SCROLL
      ────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <NarrativeScroll onSectionEnter={setActiveSection} />
      </Suspense>

      {/* ──────────────────────────────────────────
          FINAL CTA
      ────────────────────────────────────────── */}
      <section className="relative py-28 md:py-36 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[100px]" style={{ background: "radial-gradient(ellipse, #bef26412 0%, transparent 70%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative p-12 md:p-16 rounded-3xl border backdrop-blur-xl overflow-hidden"
            style={{
              borderColor: "rgba(190,242,100,0.12)",
              backgroundColor: "rgba(0,0,0,0.4)",
              boxShadow: "0 0 80px rgba(190,242,100,0.06)",
            }}
          >
            <div className="absolute top-0 left-12 right-12 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(190,242,100,0.6), transparent)" }} />

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#bef264]/20 bg-[#bef264]/5 text-[#bef264] text-xs font-mono uppercase tracking-widest mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bef264] animate-pulse" />
              No wearable required
            </div>

            <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-6">
              Your neural fingerprint<br />
              <span className="text-[#bef264]">starts here.</span>
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-10 max-w-lg mx-auto">
              Three short tasks, no account needed. Your first cognitive baseline takes under 5 minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/start"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-black overflow-hidden"
                style={{ background: "linear-gradient(135deg, #bef264, #a3e635)", boxShadow: "0 0 48px #bef26440" }}
              >
                <span className="absolute inset-0 rounded-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10">Begin free baseline</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/10 text-white/70 hover:border-white/20 hover:text-white transition-all"
              >
                Create account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          FOOTER
      ────────────────────────────────────────── */}
      <footer className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <AqlaLogo className="text-foreground" showWordmark={false} />
            <span className="font-mono">© 2026 AQLA. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
            <span className="text-white/20">Neural wellness, not medical advice.</span>
          </div>
        </div>
      </footer>
    </div>
    </LocoScrollProvider>
  );
}