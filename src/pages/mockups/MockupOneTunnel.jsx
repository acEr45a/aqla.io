import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Activity, Zap, CheckCircle2, ShieldCheck, Radio, Sparkles, Brain, Clock, Shield } from "lucide-react";
import { animate, stagger } from "animejs";
import AqlaLogo from "@/components/AqlaLogo";
import MockupSwitcherDock from "@/components/landing/mockups/MockupSwitcherDock";
import PsychometricMiniLab from "@/components/landing/3d/PsychometricMiniLab";
import { LocoScrollProvider, useLocoScroll } from "@/lib/LocoScrollProvider";

const ObsidianRefractionCanvas = lazy(() =>
  import("@/components/landing/3d/ObsidianRefractionCanvas")
);

function CanvasFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050807] z-0">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#bef264] border-t-transparent animate-spin" />
        <span className="text-[11px] font-mono text-white/40 tracking-[0.25em] uppercase">
          Synthesizing Obsidian Glass Cortex...
        </span>
      </div>
    </div>
  );
}

function MockupOneContent() {
  const scrollProgressRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { instance, ready } = useLocoScroll();

  // Bind Locomotive Scroll v5 instance for continuous progress
  useEffect(() => {
    if (instance?.current) {
      const handleLocoScroll = ({ scroll, limit }) => {
        if (limit > 0) {
          const p = Math.min(1, Math.max(0, scroll / limit));
          scrollProgressRef.current = p;
          setScrollProgress(p);
        }
      };

      instance.current.on("scroll", handleLocoScroll);
      return () => {
        if (instance.current?.off) {
          instance.current.off("scroll", handleLocoScroll);
        }
      };
    }
  }, [instance, ready]);

  // Fallback native window scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const p = Math.min(1, Math.max(0, window.scrollY / scrollHeight));
        scrollProgressRef.current = p;
        setScrollProgress(p);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Entrance animations for studio typography
  useEffect(() => {
    animate(".studio-fade", {
      opacity: [0, 1],
      translateY: [25, 0],
      delay: stagger(120, { start: 200 }),
      duration: 1000,
      easing: "easeOutCubic",
    });

    animate(".studio-card", {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: stagger(150, { start: 500 }),
      duration: 900,
      easing: "easeOutQuad",
    });
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050807] text-[#f4f4f5] selection:bg-[#bef264] selection:text-black font-sans overflow-x-hidden">
      {/* ── 1. FIXED BESPOKE THREE.JS OBSIDIAN REFRACTION CANVAS (PERSISTENT ACROSS SCROLL) ── */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <Suspense fallback={<CanvasFallback />}>
          <ObsidianRefractionCanvas scrollProgress={scrollProgressRef} />
        </Suspense>
      </div>

      {/* ── 2. STUDIO TOP NAVIGATION BAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 backdrop-blur-md bg-[#050807]/50 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AqlaLogo className="h-6 w-auto text-white" />
            <span className="hidden sm:inline-block text-[11px] font-mono tracking-[0.25em] text-white/40 border-l border-white/10 pl-3">
              MOCKUP 1 // OBSIDIAN ASYMMETRIC STUDIO
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <a href="#telemetry" className="text-xs font-mono tracking-widest text-white/60 hover:text-white transition-colors uppercase">
              Telemetry
            </a>
            <a href="#lab" className="text-xs font-mono tracking-widest text-white/60 hover:text-white transition-colors uppercase">
              Psychometrics
            </a>
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
          </nav>
        </div>
      </header>

      {/* ── 3. ASYMMETRIC STUDIO HERO (LEFT 45% TYPOGRAPHY, RIGHT 55% 3D STAGE) ── */}
      <section className="relative z-10 min-h-screen flex items-center pt-28 pb-16 px-6 md:px-12 pointer-events-none">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Asymmetric Column: Giant Display Typography & Technical Data */}
          <div className="lg:col-span-6 pointer-events-auto" data-scroll data-scroll-speed="0.8">
            {/* Status Chip */}
            <div className="studio-fade inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#bef264]/30 bg-[#bef264]/10 text-xs font-mono text-[#bef264] backdrop-blur-xl mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bef264] animate-pulse" />
              <span>OBSIDIAN CORTEX // PHYSICAL TRANSMISSION 0.88</span>
            </div>

            {/* Giant Display Headline */}
            <h1 className="studio-fade text-5xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-light tracking-[-0.035em] text-white leading-[1.02] mb-6">
              The neural signal, <br />
              <span className="font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#bef264] via-[#d9f99d] to-[#38bdf8]">
                rendered in obsidian.
              </span>
            </h1>

            {/* Restrained Subtitle */}
            <p className="studio-fade text-base sm:text-lg text-white/70 max-w-xl font-light leading-relaxed mb-10">
              AQLA decodes cognitive bandwidth with sub-second psychometrics. No wearable lag. Zero algorithmic guesswork. Mapped in real-time refractive 3D.
            </p>

            {/* High-Contrast Action CTAs */}
            <div className="studio-fade flex flex-wrap items-center gap-4 mb-14">
              <Link
                to="/start"
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-sm text-black bg-[#bef264] hover:bg-[#d9f99d] shadow-[0_0_35px_rgba(190,242,100,0.4)] transition-all duration-300 hover:scale-[1.02]"
              >
                <span>Start Free Baseline Assessment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#lab"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-white/90 text-sm font-medium transition-all duration-300"
              >
                <span>Explore In-Situ Lab</span>
              </a>
            </div>

            {/* Telemetry Swiss Grid Counters */}
            <div className="studio-fade pt-8 border-t border-white/10 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <div className="text-2xl sm:text-3xl font-light text-white">±8<span className="text-xs font-mono text-[#bef264] ml-1">ms</span></div>
                <div className="text-[11px] font-mono text-white/50 tracking-wider uppercase mt-1">PVT-B Precision</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-light text-white">10.4<span className="text-xs font-mono text-[#38bdf8] ml-1">Hz</span></div>
                <div className="text-[11px] font-mono text-white/50 tracking-wider uppercase mt-1">Alpha Synchrony</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-light text-white">94.2<span className="text-xs font-mono text-[#bef264] ml-1">%</span></div>
                <div className="text-[11px] font-mono text-white/50 tracking-wider uppercase mt-1">Synaptic Coherence</div>
              </div>
            </div>
          </div>

          {/* Right Column: Kept completely open for the 3D Obsidian Cortex stage */}
          <div className="lg:col-span-6 min-h-[380px] lg:min-h-[580px]" />
        </div>
      </section>

      {/* ── 4. CHAPTER 1: THE RAW TELEMETRY (BORDERLESS GLASS CARDS) ── */}
      <section id="telemetry" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-32" data-scroll>
        <div className="max-w-2xl mb-16" data-scroll data-scroll-speed="0.6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-xs font-mono uppercase tracking-[0.2em] text-[#38bdf8] mb-4">
            <Activity className="w-3.5 h-3.5" /> Stage 01 // Sub-Second Telemetry
          </span>
          <h2 className="text-4xl sm:text-5xl font-light text-white tracking-tight leading-tight">
            Anatomical precision. <br />
            <span className="text-[#38bdf8]">Zero statistical noise.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="studio-card p-8 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl hover:border-[#bef264]/40 transition-all duration-300" data-scroll data-scroll-speed="0.4">
            <div className="w-10 h-10 rounded-2xl border border-[#bef264]/30 bg-[#bef264]/10 flex items-center justify-center text-[#bef264] mb-6">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-[#bef264] tracking-widest uppercase mb-1">FRONTAL EXECUTIVE</div>
            <h3 className="text-xl font-medium text-white mb-3">DLPFC Coherence</h3>
            <p className="text-sm text-white/60 font-light leading-relaxed">
              Real-time monitoring of dorsolateral prefrontal cortex firing rates, measuring sustained vigilance and impulse gating.
            </p>
          </div>

          <div className="studio-card p-8 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl hover:border-[#38bdf8]/40 transition-all duration-300" data-scroll data-scroll-speed="0.7">
            <div className="w-10 h-10 rounded-2xl border border-[#38bdf8]/30 bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8] mb-6">
              <Brain className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-[#38bdf8] tracking-widest uppercase mb-1">WORKING MEMORY</div>
            <h3 className="text-xl font-medium text-white mb-3">Hippocampal Buffer</h3>
            <p className="text-sm text-white/60 font-light leading-relaxed">
              Phonological loop capacity and backward numerical sequence retention calibrated to millisecond cognitive load.
            </p>
          </div>

          <div className="studio-card p-8 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl hover:border-emerald-400/40 transition-all duration-300" data-scroll data-scroll-speed="1.0">
            <div className="w-10 h-10 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 flex items-center justify-center text-emerald-400 mb-6">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-1">AUTONOMIC TONE</div>
            <h3 className="text-xl font-medium text-white mb-3">Vagal HRV Resilience</h3>
            <p className="text-sm text-white/60 font-light leading-relaxed">
              Cardiovascular parasympathetic rebound kinetics buffering neuroendocrine cortisol surges under acute load.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. CHAPTER 2: SEAMLESS IN-SITU PSYCHOMETRIC LAB ── */}
      <section id="lab" className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-32" data-scroll>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#bef264]/30 bg-[#bef264]/10 text-xs font-mono uppercase tracking-[0.2em] text-[#bef264] mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Stage 02 // Zero-Install Sandbox
          </span>
          <h2 className="text-4xl sm:text-5xl font-light text-white tracking-tight leading-tight">
            Test your reaction time right now.
          </h2>
          <p className="mt-4 text-base text-white/60 font-light">
            No signup. No wearable required. Experience AQLA's millisecond PVT-B protocol directly in this window.
          </p>
        </div>

        <div className="w-full bg-black/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl">
          <PsychometricMiniLab />
        </div>
      </section>

      {/* ── 6. CHAPTER 3: EVIDENCE PASSPORT FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-xl px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <AqlaLogo className="h-6 w-auto text-white" />
            <p className="mt-3 text-xs text-white/50 font-mono">
              VALIDATED NEURAL WELLNESS & PSYCHOMETRIC COGNITIVE ARCHITECTURE
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-xs font-mono text-white/60">
            <Link to="/science" className="hover:text-white transition-colors">SCIENCE & EVIDENCE</Link>
            <Link to="/trust" className="hover:text-white transition-colors">SECURITY & PRIVACY</Link>
            <Link to="/start" className="text-[#bef264] hover:underline">START BASELINE →</Link>
          </div>
        </div>
      </footer>

      {/* ── 7. COLLAPSIBLE SWITCHER DOCK ── */}
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
          smoothTouch: false,
        },
      }}
    >
      <MockupOneContent />
    </LocoScrollProvider>
  );
}
