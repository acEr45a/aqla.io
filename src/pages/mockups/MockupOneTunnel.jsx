import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Activity,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Sparkles,
  Brain,
  Clock,
  Shield,
  Layers,
} from "lucide-react";
import AqlaLogo from "@/components/AqlaLogo";
import MockupSwitcherDock from "@/components/landing/mockups/MockupSwitcherDock";
import PsychometricMiniLab from "@/components/landing/3d/PsychometricMiniLab";
import { LocoScrollProvider, useLocoScroll } from "@/lib/LocoScrollProvider";

const FullscreenTunnelBrainCanvas = lazy(() =>
  import("@/components/landing/3d/FullscreenTunnelBrainCanvas")
);

function CanvasFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#04070a] z-0">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-[#bef264] border-t-transparent animate-spin" />
        <span className="text-[11px] font-mono text-white/40 tracking-[0.25em] uppercase">
          Synthesizing 3D Neural Axon Tunnel...
        </span>
      </div>
    </div>
  );
}

export const TUNNEL_WAYPOINTS = [
  {
    index: 0,
    depthLabel: "Z: 22.0",
    tag: "TUNNEL ENTRY",
    badge: "STAGE 01 // DEEP AXON TUNNEL ENTRY // Z: 22.0",
    color: "#bef264",
    title: "The neural signal,",
    highlight: "mapped at the speed of thought.",
    sub: "AQLA decodes cognitive bandwidth with sub-second psychometrics. Accelerate through the synaptic axon tunnel into the living neural cortex.",
  },
  {
    index: 1,
    depthLabel: "Z: 14.0",
    tag: "AXON TRANSIT",
    badge: "STAGE 02 // SUB-SECOND AXON TELEMETRY // Z: 14.0",
    color: "#38bdf8",
    title: "Millisecond transmission.",
    highlight: "Zero latency noise.",
    sub: "Every spike of action potential variance and prefrontal gating captured with laboratory psychometric precision.",
  },
  {
    index: 2,
    depthLabel: "Z: 7.5",
    tag: "CORTEX ARRIVAL",
    badge: "STAGE 03 // 8-DOMAIN HOLOGRAPHIC CORTEX // Z: 7.5",
    color: "#bef264",
    title: "Eight neural domains.",
    highlight: "One integrated map.",
    sub: "Focus, memory buffers, resilience, sleep architecture, and autonomic tone synthesized into a single cohesive frosted obsidian brain.",
  },
  {
    index: 3,
    depthLabel: "Z: 4.3",
    tag: "IN-SITU LAB",
    badge: "STAGE 04 // ZERO-INSTALL PSYCHOMETRIC LAB // Z: 4.3",
    color: "#bef264",
    title: "Test your reaction time right now.",
    highlight: "",
    sub: "No signup. No wearable lag. Calibrate your psychomotor vigilance (PVT-B) directly in this floating HUD.",
  },
  {
    index: 4,
    depthLabel: "Z: 3.6",
    tag: "EVIDENCE PASSPORT",
    badge: "STAGE 05 // GRADED CLINICAL EVIDENCE // Z: 3.6",
    color: "#a78bfa",
    title: "Validated science.",
    highlight: "Zero wearable friction.",
    sub: "100% literature-transparent protocols backed by peer-reviewed clinical neuroscience and circadian biology.",
  },
];

function MockupOneContent() {
  const scrollProgressRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeWaypoint, setActiveWaypoint] = useState(0);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const { instance, ready } = useLocoScroll();

  // 5-waypoint scroll target percentages for smooth programmatic navigation
  const WAYPOINT_SCROLL_TARGETS = [0.02, 0.25, 0.50, 0.74, 0.96];

  const goToWaypoint = (idx) => {
    const targetIdx = Math.max(0, Math.min(TUNNEL_WAYPOINTS.length - 1, idx));
    const targetP = WAYPOINT_SCROLL_TARGETS[targetIdx];
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = targetP * maxScroll;

    if (instance?.current?.scrollTo) {
      instance.current.scrollTo(targetY, { duration: 1.1 });
    } else {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  // Track mouse coordinates for subtle, interactive 3D axon tunnel parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX.current = x;
      mouseY.current = y;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Coordinated single-source-of-truth scroll listener
  useEffect(() => {
    const updateFromProgress = (p) => {
      const clampedP = Math.min(1, Math.max(0, p));
      scrollProgressRef.current = clampedP;
      setScrollProgress(clampedP);

      // Calibrated waypoint zones with generous dwell plateaus
      let idx = 0;
      if (clampedP >= 0.86) {
        idx = 4;
      } else if (clampedP >= 0.62) {
        idx = 3;
      } else if (clampedP >= 0.38) {
        idx = 2;
      } else if (clampedP >= 0.14) {
        idx = 1;
      } else {
        idx = 0;
      }
      setActiveWaypoint(idx);
    };

    if (instance?.current) {
      const handleLocoScroll = ({ scroll, limit }) => {
        if (limit > 0) {
          updateFromProgress(scroll / limit);
        }
      };
      instance.current.on("scroll", handleLocoScroll);
      return () => {
        if (instance.current?.off) {
          instance.current.off("scroll", handleLocoScroll);
        }
      };
    } else {
      const handleNativeScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight > 0) {
          updateFromProgress(window.scrollY / scrollHeight);
        }
      };
      window.addEventListener("scroll", handleNativeScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleNativeScroll);
    }
  }, [instance, ready]);

  const currentWp = TUNNEL_WAYPOINTS[activeWaypoint];

  return (
    <div className="relative bg-[#04070a] text-white selection:bg-[#bef264] selection:text-black font-sans overflow-x-hidden">
      {/* ── TOP FIXED NAVIGATION ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 backdrop-blur-md bg-[#04070a]/50 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AqlaLogo className="h-6 w-auto text-white" />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-[11px] font-mono tracking-[0.2em] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bef264] animate-pulse" />
              <span>MOCKUP 1 // 3D AXON TUNNEL UNIVERSE</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 font-mono text-xs">
              <span className="text-white/40">CAMERA DEPTH:</span>
              <span className="text-[#bef264] font-semibold">{currentWp.depthLabel}</span>
              <span className="text-white/20">|</span>
              <span className="text-white/60">{currentWp.tag}</span>
            </div>

            <Link
              to="/login"
              className="text-xs font-mono tracking-widest text-white/70 hover:text-white transition-colors uppercase"
            >
              Sign In
            </Link>
            <Link
              to="/start"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-black bg-[#bef264] hover:bg-[#d9f99d] shadow-[0_0_24px_rgba(190,242,100,0.35)] transition-all duration-300 hover:scale-[1.02]"
            >
              <span>Begin Baseline</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 850vh EXPANDED CONTINUOUS 3D TUNNEL JOURNEY (LUXURY RUNWAY) ── */}
      <section className="relative h-[850vh] w-full">
        {/* Sticky 100vh Fullscreen Viewport */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-[#04070a]">
          {/* 1. Fullscreen 3D Neural Axon Tunnel Engine */}
          <Suspense fallback={<CanvasFallback />}>
            <FullscreenTunnelBrainCanvas scrollProgress={scrollProgressRef} mouseX={mouseX} mouseY={mouseY} />
          </Suspense>

          {/* Ambient dynamic radial illumination matching current waypoint */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-1000 -z-10"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${currentWp.color}15 0%, transparent 75%)`,
            }}
          />

          {/* ── Left-Hand Interactive Waypoint Telemetry Rail (Desktop) ── */}
          <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-40 pointer-events-auto">
            {TUNNEL_WAYPOINTS.map((wp, i) => {
              const isActive = i === activeWaypoint;
              return (
                <button
                  key={wp.index}
                  type="button"
                  onClick={() => goToWaypoint(i)}
                  className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none transition-all py-1"
                  title={`Jump to ${wp.tag} (${wp.depthLabel})`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover:scale-125 ${
                      isActive
                        ? "scale-125 shadow-[0_0_12px_#bef264]"
                        : "opacity-30 group-hover:opacity-90"
                    }`}
                    style={{ backgroundColor: isActive ? wp.color : "white" }}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-[10px] font-mono tracking-widest transition-colors ${
                        isActive ? "text-white font-bold" : "text-white/40 group-hover:text-white/80"
                      }`}
                    >
                      {wp.depthLabel}
                    </span>
                    <span
                      className={`text-[9px] font-mono tracking-wider transition-colors ${
                        isActive ? "text-[#bef264]" : "text-white/20 group-hover:text-white/60"
                      }`}
                    >
                      {wp.tag}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Dynamic Aerospace / Cybernetic Glass HUD Overlays ── */}
          <div className="relative z-30 max-w-5xl mx-auto px-6 w-full flex flex-col items-center justify-center pointer-events-none pt-16">
            <AnimatePresence mode="popLayout">
              {/* WAYPOINT 0: HERO TUNNEL ENTRY */}
              {activeWaypoint === 0 && (
                <motion.div
                  key="wp-0"
                  initial={{ opacity: 0, y: 24, scale: 0.98, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(6px)" }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-3xl pointer-events-auto p-8 sm:p-12 rounded-3xl backdrop-blur-[12px] bg-[#04070a]/65 border border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.85)] text-center"
                >
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#bef264]/30 bg-[#bef264]/10 text-xs font-mono text-[#bef264] backdrop-blur-xl mb-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#bef264] animate-pulse" />
                    <span>{currentWp.badge}</span>
                  </div>

                  <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.04] mb-6">
                    {currentWp.title} <br />
                    <span className="font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#bef264] via-[#d9f99d] to-[#38bdf8]">
                      {currentWp.highlight}
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg text-white/75 font-light leading-relaxed mb-8 max-w-xl mx-auto">
                    {currentWp.sub}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                    <Link
                      to="/start"
                      className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-sm text-black bg-[#bef264] hover:bg-[#d9f99d] shadow-[0_0_35px_rgba(190,242,100,0.4)] transition-all duration-300 hover:scale-[1.02]"
                    >
                      <span>Start Free Baseline</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => goToWaypoint(1)}
                      className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#bef264]/40 text-xs font-mono text-white/70 hover:text-white transition-all cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4 animate-bounce text-[#bef264]" />
                      Scroll or click to fly into tunnel
                    </button>
                  </div>

                  <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <div>
                      <div className="text-2xl font-light text-white">±8<span className="text-xs font-mono text-[#bef264]">ms</span></div>
                      <div className="text-[10px] font-mono text-white/50 uppercase mt-0.5">PVT-B Latency</div>
                    </div>
                    <div>
                      <div className="text-2xl font-light text-white">10.4<span className="text-xs font-mono text-[#38bdf8]">Hz</span></div>
                      <div className="text-[10px] font-mono text-white/50 uppercase mt-0.5">Alpha Synchrony</div>
                    </div>
                    <div>
                      <div className="text-2xl font-light text-white">94.2<span className="text-xs font-mono text-[#bef264]">%</span></div>
                      <div className="text-[10px] font-mono text-white/50 uppercase mt-0.5">Coherence</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* WAYPOINT 1: AXON TRANSIT TELEMETRY */}
              {activeWaypoint === 1 && (
                <motion.div
                  key="wp-1"
                  initial={{ opacity: 0, y: 24, scale: 0.98, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(6px)" }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-4xl pointer-events-auto p-8 sm:p-10 rounded-3xl backdrop-blur-[12px] bg-[#04070a]/75 border border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.85)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="text-xs font-mono text-[#38bdf8] uppercase tracking-widest mb-1">
                        {currentWp.badge}
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-light text-white">
                        {currentWp.title} <span className="text-[#38bdf8]">{currentWp.highlight}</span>
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-white/50 border border-white/10 px-3 py-1 rounded-full shrink-0">
                      Z-AXIS DEPTH: 14.0m
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-5">
                    <div className="p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md">
                      <div className="w-8 h-8 rounded-xl border border-[#bef264]/30 bg-[#bef264]/10 flex items-center justify-center text-[#bef264] mb-4">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="text-[10px] font-mono text-[#bef264] tracking-widest uppercase mb-1">FRONTAL EXECUTIVE</div>
                      <div className="text-base font-medium text-white mb-2">DLPFC Firing Stability</div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        Continuous vigilance and impulse inhibition measured without noisy peripheral hardware.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md">
                      <div className="w-8 h-8 rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8] mb-4">
                        <Brain className="w-4 h-4" />
                      </div>
                      <div className="text-[10px] font-mono text-[#38bdf8] tracking-widest uppercase mb-1">WORKING MEMORY</div>
                      <div className="text-base font-medium text-white mb-2">Hippocampal Span</div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        Phonological loop limits and backward sequence capacity calibrated to cognitive load.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md">
                      <div className="w-8 h-8 rounded-xl border border-emerald-400/30 bg-emerald-400/10 flex items-center justify-center text-emerald-400 mb-4">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase mb-1">AUTONOMIC REBOUND</div>
                      <div className="text-base font-medium text-white mb-2">Vagal Tone Resilience</div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        Parasympathetic cardiovascular rebound kinetics buffering neuroendocrine surges.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* WAYPOINT 2: CORTEX ARRIVAL & 8-DOMAIN MATRIX */}
              {activeWaypoint === 2 && (
                <motion.div
                  key="wp-2"
                  initial={{ opacity: 0, y: 24, scale: 0.98, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(6px)" }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-4xl pointer-events-auto p-8 sm:p-10 rounded-3xl backdrop-blur-[12px] bg-[#04070a]/75 border border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.85)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="text-xs font-mono text-[#bef264] uppercase tracking-widest mb-1">
                        {currentWp.badge}
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-light text-white">
                        {currentWp.title} <span className="text-[#bef264]">{currentWp.highlight}</span>
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-[#bef264] border border-[#bef264]/30 bg-[#bef264]/10 px-3 py-1 rounded-full shrink-0">
                      CORTEX SILHOUETTE ACTIVE
                    </span>
                  </div>

                  <p className="text-sm text-white/70 font-light mb-6">
                    {currentWp.sub}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: "Executive DLPFC", score: "94.2%", tag: "STABLE", color: "#bef264" },
                      { name: "Hippocampus Memory", score: "7.2 Digits", tag: "OPTIMAL", color: "#38bdf8" },
                      { name: "Vagal HRV Tone", score: "68 ms", tag: "REBOUND", color: "#10b981" },
                      { name: "Delta Sleep Sync", score: "1.2 Hz", tag: "RESTORE", color: "#a78bfa" },
                    ].map((d, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-white/10 bg-black/60">
                        <div className="text-[10px] font-mono text-white/50 uppercase">{d.name}</div>
                        <div className="text-xl font-light text-white my-1">{d.score}</div>
                        <span
                          className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                          style={{ borderColor: `${d.color}40`, color: d.color, backgroundColor: `${d.color}15` }}
                        >
                          {d.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* WAYPOINT 3: IN-SITU PLAYABLE PSYCHOMETRIC LAB */}
              {activeWaypoint === 3 && (
                <motion.div
                  key="wp-3"
                  initial={{ opacity: 0, y: 24, scale: 0.98, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(6px)" }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-4xl pointer-events-auto p-6 sm:p-8 rounded-3xl backdrop-blur-[14px] bg-[#04070a]/85 border border-white/[0.10] shadow-[0_0_80px_rgba(0,0,0,0.9)]"
                >
                  <div className="text-center mb-4">
                    <div className="text-xs font-mono text-[#bef264] uppercase tracking-widest mb-1">
                      {currentWp.badge}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-light text-white">
                      {currentWp.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 font-light mt-1">
                      {currentWp.sub}
                    </p>
                  </div>

                  <div className="w-full bg-black/70 rounded-2xl border border-white/10 p-4 sm:p-6">
                    <PsychometricMiniLab />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs font-mono">
                    <span className="text-white/40">CALIBRATING PREFRONTAL VIGILANCE IN REAL-TIME</span>
                    <button
                      type="button"
                      onClick={() => goToWaypoint(4)}
                      className="inline-flex items-center gap-1.5 text-[#bef264] hover:text-[#d9f99d] transition-colors cursor-pointer"
                    >
                      <span>Proceed to Evidence Passport</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* WAYPOINT 4: EVIDENCE PASSPORT & LAUNCH BASELINE */}
              {activeWaypoint === 4 && (
                <motion.div
                  key="wp-4"
                  initial={{ opacity: 0, y: 24, scale: 0.98, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(6px)" }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-3xl pointer-events-auto p-8 sm:p-12 rounded-3xl backdrop-blur-[14px] bg-[#04070a]/85 border border-white/[0.10] shadow-[0_0_80px_rgba(0,0,0,0.9)] text-center"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 text-xs font-mono text-[#a78bfa] mb-6">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{currentWp.badge}</span>
                  </div>

                  <h2 className="text-4xl sm:text-5xl font-light text-white tracking-tight leading-tight mb-4">
                    {currentWp.title} <br />
                    <span className="text-[#a78bfa]">{currentWp.highlight}</span>
                  </h2>

                  <p className="text-sm sm:text-base text-white/70 font-light max-w-lg mx-auto mb-8">
                    {currentWp.sub}
                  </p>

                  <div className="grid sm:grid-cols-3 gap-4 text-left mb-8">
                    <div className="p-4 rounded-xl border border-white/10 bg-black/60">
                      <div className="text-xl font-light text-[#bef264]">100%</div>
                      <div className="text-xs font-medium text-white mt-1">Literature Transparent</div>
                      <p className="text-[10px] text-white/50 mt-1">Peer-reviewed PubMed citations for every protocol.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/10 bg-black/60">
                      <div className="text-xl font-light text-[#38bdf8]">7 Tasks</div>
                      <div className="text-xs font-medium text-white mt-1">Cognitive Battery</div>
                      <p className="text-[10px] text-white/50 mt-1">PVT-B, Wechsler, Corsi block, SART vigilance.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/10 bg-black/60">
                      <div className="text-xl font-light text-emerald-400">0 Devices</div>
                      <div className="text-xs font-medium text-white mt-1">Zero Friction</div>
                      <p className="text-[10px] text-white/50 mt-1">Runs in any browser. No rings or watches required.</p>
                    </div>
                  </div>

                  <Link
                    to="/start"
                    className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full font-semibold text-sm text-black bg-[#bef264] hover:bg-[#d9f99d] shadow-[0_0_35px_rgba(190,242,100,0.45)] transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span>Launch Baseline Assessment Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom HUD: Live Engine Coordinates & Navigation Stepper */}
          <div className="absolute bottom-6 left-6 md:left-12 right-6 md:right-12 flex items-center justify-between pointer-events-auto z-40">
            <div className="flex items-center gap-4 text-[11px] font-mono text-white/40">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>TUNNEL FLIGHT ENGINE // WEBGL2</span>
              </div>
              <span className="hidden sm:inline">|</span>
              <div className="hidden sm:inline">Z-DEPTH: {currentWp.depthLabel}</div>
              <span className="hidden md:inline">|</span>
              <div className="hidden md:inline">MOMENTUM: SILKY LENIS ACTIVE</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeWaypoint === 0}
                onClick={() => goToWaypoint(activeWaypoint - 1)}
                className="px-3 py-1.5 rounded-lg border border-white/15 bg-black/60 backdrop-blur-md text-xs font-mono text-white/70 hover:text-white hover:border-[#bef264]/40 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              >
                ← PREV
              </button>
              <span className="text-xs font-mono text-[#bef264] px-1.5">
                0{activeWaypoint + 1} / 0{TUNNEL_WAYPOINTS.length}
              </span>
              <button
                type="button"
                disabled={activeWaypoint === TUNNEL_WAYPOINTS.length - 1}
                onClick={() => goToWaypoint(activeWaypoint + 1)}
                className="px-3 py-1.5 rounded-lg border border-white/15 bg-black/60 backdrop-blur-md text-xs font-mono text-white/70 hover:text-white hover:border-[#bef264]/40 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              >
                NEXT →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── COLLAPSIBLE MOCKUP SWITCHER DOCK ── */}
      <MockupSwitcherDock />
    </div>
  );
}

export default function MockupOneTunnel() {
  return (
    <LocoScrollProvider
      options={{
        lenisOptions: {
          lerp: 0.075,
          duration: 1.25,
          smoothWheel: true,
          smoothTouch: true,
          wheelMultiplier: 1.0,
          touchMultiplier: 1.2,
        },
      }}
    >
      <MockupOneContent />
    </LocoScrollProvider>
  );
}
