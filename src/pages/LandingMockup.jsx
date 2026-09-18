import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronRight, Activity, Zap, CheckCircle2, ShieldCheck, Radio } from "lucide-react";
import { LocoScrollProvider } from "@/lib/LocoScrollProvider";
import AqlaLogo from "@/components/AqlaLogo";
import BiometricHudOverlay from "@/components/landing/3d/BiometricHudOverlay";
import CognitiveBentoGrid from "@/components/landing/3d/CognitiveBentoGrid";
import PsychometricMiniLab from "@/components/landing/3d/PsychometricMiniLab";
import CircadianProtocolStack from "@/components/landing/3d/CircadianProtocolStack";

const Hero3DBrainCanvas = lazy(() => import("@/components/landing/3d/Hero3DBrainCanvas"));

function CanvasFallback() {
  return (
    <div className="w-full h-full min-h-[480px] rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-[#bef264] border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-white/50 tracking-widest uppercase">
          Synthesizing 3D Neural Cortex...
        </span>
      </div>
    </div>
  );
}

// 4 Cinematic Scroll Phases for the Pinned 3D Journey
const NARRATIVE_PHASES = [
  {
    phase: 1,
    tag: "The Broadcast",
    headline: "Your brain is broadcasting telemetry.",
    sub: "Every millisecond of reaction variance and circadian shift emits a distinct signature. AQLA begins by capturing the signal your neural architecture is already broadcasting.",
    badge: "STAGE 01 // TELEMETRY ACTIVE",
    color: "#bef264",
    nodeId: null,
  },
  {
    phase: 2,
    tag: "The Prefrontal Zoom",
    headline: "Millisecond latency. Validated science.",
    sub: "Sustained attention stability. Inhibitory impulse gating. Dorsolateral prefrontal firing rates mapped with laboratory psychometric precision.",
    badge: "STAGE 02 // PREFRONTAL CALIBRATION",
    color: "#38bdf8",
    nodeId: "pfc_left",
  },
  {
    phase: 3,
    tag: "The 8-Domain Matrix",
    headline: "Eight neural domains. One integrated map.",
    sub: "Focus, memory buffers, resilience, sleep architecture, and autonomic tone synthesized into a single cohesive holographic brain map.",
    badge: "STAGE 03 // HOLOGRAPHIC SYNTHESIS",
    color: "#bef264",
    nodeId: "hippocampus_l",
  },
  {
    phase: 4,
    tag: "The Circadian Alignment",
    headline: "Targeted protocols. Calibrated to your clock.",
    sub: "Light-gated circadian resetting. Ultradian 90-minute focus sprints. Neuroendocrine buffering—orchestrated around your biological peak windows.",
    badge: "STAGE 04 // PROTOCOL STACK",
    color: "#a78bfa",
    nodeId: "insula",
  },
];

/**
 * Pinned 400vh Kinetic 3D Neural Journey
 * Locks the 3D Canvas in a sticky viewport while 4 narrative chapters scroll past.
 */
function Pinned3DExperience() {
  const containerRef = useRef(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [scrollProgressVal, setScrollProgressVal] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      setScrollProgressVal(v);
      const idx = Math.min(NARRATIVE_PHASES.length - 1, Math.floor(v * NARRATIVE_PHASES.length));
      setActivePhaseIndex(idx);
    });
    return unsub;
  }, [scrollYProgress]);

  const currentPhase = NARRATIVE_PHASES[activePhaseIndex];

  return (
    <section ref={containerRef} className="relative h-[380vh] w-full">
      {/* Sticky 100vh Fullscreen Viewport */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-[#060908]">
        {/* Ambient dynamic radial illumination */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 65% 50%, ${currentPhase.color}18 0%, transparent 70%)`,
          }}
        />

        {/* 2-Column Responsive Layout */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 w-full h-full grid lg:grid-cols-12 gap-8 items-center pt-20 pb-10">
          {/* ── Left Column: Scrubbed Narrative Chapters ── */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Phase indicator progress pills */}
            <div className="flex gap-2 mb-6 max-w-xs">
              {NARRATIVE_PHASES.map((p, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: i === activePhaseIndex ? currentPhase.color : "rgba(255,255,255,0.1)",
                    boxShadow: i === activePhaseIndex ? `0 0 10px ${currentPhase.color}` : "none",
                  }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activePhaseIndex}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono uppercase tracking-widest mb-6 backdrop-blur-md"
                  style={{
                    borderColor: `${currentPhase.color}40`,
                    color: currentPhase.color,
                    backgroundColor: `${currentPhase.color}10`,
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: currentPhase.color }} />
                  {currentPhase.badge}
                </div>

                <h2 className="text-3xl sm:text-5xl md:text-6xl font-light text-white leading-[1.08] tracking-tight">
                  {currentPhase.headline}
                </h2>

                <p className="mt-6 text-base sm:text-lg text-white/60 leading-relaxed font-normal max-w-md">
                  {currentPhase.sub}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Scroll instruction cue */}
            <div className="mt-12 flex items-center gap-2 text-white/30 text-xs font-mono tracking-widest uppercase">
              <ChevronDown className="w-4 h-4 text-[#bef264] animate-bounce" />
              <span>Scroll to navigate 3D neural space ({Math.round(scrollProgressVal * 100)}%)</span>
            </div>
          </div>

          {/* ── Right Column: Interactive 3D Canvas Stage ── */}
          <div className="lg:col-span-7 relative h-[420px] sm:h-[540px] md:h-[620px] lg:h-[680px] w-full rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Top glass gradient line */}
            <div
              className="absolute top-0 left-8 right-8 h-px z-20"
              style={{
                background: `linear-gradient(90deg, transparent, ${currentPhase.color}, transparent)`,
              }}
            />

            {/* Floating Biometric Telemetry Overlays */}
            <BiometricHudOverlay />

            {/* Kinetic Three.js Canvas */}
            <Suspense fallback={<CanvasFallback />}>
              <Hero3DBrainCanvas
                scrollProgress={scrollProgressVal}
                activeNodeId={currentPhase.nodeId}
              />
            </Suspense>

            {/* Bottom Real-time Telemetry Strip */}
            <div className="absolute bottom-0 inset-x-0 z-20 py-2.5 px-6 border-t border-white/5 bg-black/70 backdrop-blur-md flex items-center justify-between text-[11px] font-mono text-white/40">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#bef264] animate-pulse" />
                ORBITAL 3D PROJECTION · SCROLL ACCELERATED
              </span>
              <span className="text-[#bef264]">MOVE MOUSE TO TILT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingMockup() {
  const [synapseCount, setSynapseCount] = useState(1480);

  useEffect(() => {
    const timer = setInterval(() => {
      setSynapseCount((prev) => prev + Math.floor(Math.random() * 9) - 3);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <LocoScrollProvider
      options={{
        lenisOptions: {
          lerp: 0.075,
          duration: 1.3,
          smoothWheel: true,
        },
      }}
    >
      <main className="overflow-x-hidden w-full max-w-full min-h-screen bg-[#060908] text-white selection:bg-[#bef264] selection:text-black font-sans relative aqla-grain">
        {/* ── BACKGROUND CYBER-GRID ── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #bef264 1px, transparent 1px), linear-gradient(to bottom, #bef264 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
          />
        </div>

        {/* ── FLOATING GLASS PILL NAVIGATION ── */}
        <header className="fixed top-6 left-0 right-0 z-50 max-w-5xl mx-auto px-4">
          <nav
            className="relative flex items-center justify-between px-6 py-3 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl transition-all"
            style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.8)" }}
          >
            <div className="flex items-center gap-3">
              <AqlaLogo className="text-white scale-90 origin-left" />
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#bef264] animate-pulse" />
                <span className="text-[11px] font-mono text-white/50 tracking-wider uppercase">
                  AQLA OS v2.6 · 3D Cinema
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm text-white/70 font-medium">
              <a href="#narrative" className="hover:text-[#bef264] transition-colors">3D Journey</a>
              <a href="#sandbox" className="hover:text-[#bef264] transition-colors">Reaction Lab</a>
              <a href="#domains" className="hover:text-[#bef264] transition-colors">8 Domains</a>
              <a href="#protocols" className="hover:text-[#bef264] transition-colors">Circadian Stack</a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs text-white/70 hover:text-white transition-colors px-2 py-1"
              >
                Sign in
              </Link>
              <Link
                to="/start"
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-black overflow-hidden shadow-lg transition-all"
                style={{
                  background: "linear-gradient(135deg, #bef264, #a3e635)",
                  boxShadow: "0 0 24px rgba(190, 242, 100, 0.45)",
                }}
              >
                <span className="relative z-10">Start Baseline</span>
                <ArrowRight className="relative z-10 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </nav>
        </header>

        {/* ── INTRO HERO LEAD-IN ── */}
        <section className="relative z-10 pt-36 md:pt-48 pb-16 px-4 md:px-6 text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#bef264]/30 bg-[#bef264]/5 text-xs font-mono text-[#bef264] mb-8 shadow-[0_0_24px_rgba(190,242,100,0.18)]"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>NEURAL STREAM ACTIVE</span>
            <span className="text-white/30">|</span>
            <span className="text-white/80">{synapseCount.toLocaleString()} SYNS/SEC</span>
          </motion.div>

          {/* 2-Line Iron Rule H1 with Ultra-Wide Container */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-light tracking-tight text-white leading-[1.06] max-w-5xl mx-auto"
          >
            Your brain is broadcasting telemetry. <br className="hidden sm:inline" />
            <span className="text-[#bef264] font-normal">AQLA maps the signal.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-base sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            Experience the scroll-driven 3D neural engine below. Seven validated tasks, eight cognitive domains, and personalized circadian protocols.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/start"
              className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-black overflow-hidden shadow-2xl transition-all"
              style={{
                background: "linear-gradient(135deg, #bef264, #a3e635)",
                boxShadow: "0 0 40px rgba(190, 242, 100, 0.45)",
              }}
            >
              <span className="relative z-10 text-sm">Begin Free Baseline</span>
              <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#narrative"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 text-white/90 text-sm font-medium transition-all backdrop-blur-md"
            >
              Scroll 3D Narrative
              <ChevronDown className="w-4 h-4 text-[#bef264]" />
            </a>
          </motion.div>
        </section>

        {/* ── PINNED 400VH 3D SCROLL EXPERIENCE ── */}
        <div id="narrative">
          <Pinned3DExperience />
        </div>

        {/* ── CHAPTER 2: INTERACTIVE PVT-B REACTION LAB ── */}
        <div id="sandbox" className="relative z-10">
          <PsychometricMiniLab />
        </div>

        {/* ── CHAPTER 3: GAPLESS 8-DOMAIN BENTO GRID ── */}
        <div id="domains" className="relative z-10">
          <CognitiveBentoGrid />
        </div>

        {/* ── CHAPTER 4: CIRCADIAN PROTOCOL ENGINE ── */}
        <div id="protocols" className="relative z-10">
          <CircadianProtocolStack />
        </div>

        {/* ── CHAPTER 5: CONVERSION FINALE ── */}
        <section className="relative py-32 md:py-48 px-4 md:px-6 overflow-hidden z-10">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[520px] rounded-full blur-[150px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(190,242,100,0.14) 0%, rgba(56,189,248,0.08) 50%, transparent 70%)",
            }}
          />

          <div className="relative max-w-4xl mx-auto rounded-3xl border border-white/15 bg-black/75 backdrop-blur-3xl p-10 sm:p-16 text-center shadow-2xl overflow-hidden">
            <div
              className="absolute top-0 left-12 right-12 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, #bef264, transparent)",
              }}
            />

            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#bef264]/30 bg-[#bef264]/10 text-xs font-mono text-[#bef264] mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero Hardware Friction
            </span>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-light text-white tracking-tight leading-tight">
              Your neural fingerprint <br />
              <span className="text-[#bef264]">starts in five minutes.</span>
            </h2>

            <p className="mt-6 text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
              Begin with three preview cognitive tasks. No account or credit card required. Receive your initial domain map instantly.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/start"
                className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-full font-semibold text-black overflow-hidden shadow-2xl transition-all"
                style={{
                  background: "linear-gradient(135deg, #bef264, #a3e635)",
                  boxShadow: "0 0 50px rgba(190, 242, 100, 0.45)",
                }}
              >
                <span className="relative z-10 text-sm">Start Free Baseline Now</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25 text-white text-sm font-medium transition-all"
              >
                Create Clinician / Member Account
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="relative border-t border-white/10 py-12 px-4 md:px-6 bg-black/80 z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-white/50">
            <div className="flex items-center gap-3">
              <AqlaLogo className="text-white" showWordmark={true} />
              <span className="font-mono text-[11px] text-white/40">
                © 2026 AQLA Neural Technologies. All rights reserved.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/science" className="hover:text-white transition-colors">Science & Methodology</Link>
              <Link to="/trust" className="hover:text-white transition-colors">Trust & Security</Link>
              <span className="text-white/30">Cognitive Wellness Platform</span>
            </div>
          </div>
        </footer>
      </main>
    </LocoScrollProvider>
  );
}
