import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Activity, Sparkles, Shield, Cpu, RefreshCw, CheckCircle2 } from "lucide-react";
import { animate } from "animejs";
import AqlaLogo from "@/components/AqlaLogo";
import MockupSwitcherDock from "@/components/landing/mockups/MockupSwitcherDock";
import PsychometricMiniLab from "@/components/landing/3d/PsychometricMiniLab";
import { LocoScrollProvider, useLocoScroll } from "@/lib/LocoScrollProvider";

const UnseenGlassBrainCanvas = lazy(() =>
  import("@/components/landing/3d/UnseenGlassBrainCanvas")
);

function CanvasFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#06080c] z-0">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span className="text-[11px] font-mono text-white/40 tracking-[0.25em] uppercase">
          Synthesizing Obsidian Glass Cortex...
        </span>
      </div>
    </div>
  );
}

function MockupFourContent() {
  const scrollProgressRef = useRef(0);
  const [activeTab, setActiveTab] = useState("clinical");
  const heroRef = useRef(null);
  const { instance, ready } = useLocoScroll();

  useEffect(() => {
    if (instance?.current) {
      const handleLocoScroll = ({ scroll, limit }) => {
        if (limit > 0) {
          scrollProgressRef.current = Math.min(1, Math.max(0, scroll / limit));
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        scrollProgressRef.current = Math.min(1, Math.max(0, window.scrollY / scrollHeight));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    animate(".unseen-reveal", {
      opacity: [0, 1],
      translateY: [25, 0],
      duration: 1100,
      ease: "easeOutCubic",
      delay: (el, i) => i * 150,
    });
  }, []);

  return (
    <div className="relative min-h-screen bg-[#06080c] text-[#f3f4f6] selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      {/* 1. Fixed Unseen Studio 3D Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Suspense fallback={<CanvasFallback />}>
          <UnseenGlassBrainCanvas scrollProgress={scrollProgressRef} />
        </Suspense>
      </div>

      {/* 2. Top Header Navigation (Unseen Pin Style) */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-6 pointer-events-auto backdrop-blur-md bg-[#06080c]/40 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <AqlaLogo className="h-6 w-auto text-white" />
          <span className="hidden sm:inline-block text-[11px] font-mono tracking-[0.2em] text-white/40 border-l border-white/10 pl-3">
            OBSIDIAN GLASS // UNSEEN CUT
          </span>
        </div>

        <nav className="flex items-center gap-6 text-xs font-mono tracking-widest uppercase">
          <a href="#science" className="text-white/60 hover:text-white transition-colors">
            Science
          </a>
          <a href="#telemetry" className="text-white/60 hover:text-white transition-colors">
            Telemetry
          </a>
          <Link
            to="/login"
            className="px-4 py-2 rounded-full border border-white/15 hover:border-emerald-400/50 bg-white/[0.03] hover:bg-emerald-500/10 transition-all duration-300"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* 3. Hero Section (Chapter 1) */}
      <section
        ref={heroRef}
        className="relative z-10 min-h-screen flex flex-col justify-center items-center px-6 text-center pt-24 pb-20 pointer-events-none"
      >
        <div
          className="max-w-4xl mx-auto flex flex-col items-center pointer-events-auto px-8 py-10 rounded-3xl backdrop-blur-[6px] bg-black/40 border border-white/[0.06] shadow-2xl"
          data-scroll
          data-scroll-speed="0.8"
        >
          {/* Status Chip */}
          <div className="unseen-reveal inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-xl mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/70">
              Cognitive Architecture v2.4
            </span>
          </div>

          {/* Heading */}
          <h1 className="unseen-reveal text-4xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.08] mb-6 drop-shadow-md">
            The mind, rendered in{" "}
            <span className="font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
              frosted clarity.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="unseen-reveal max-w-xl text-base sm:text-lg text-white/70 font-light leading-relaxed mb-8">
            AQLA decodes your cognitive bandwidth through validated psychometrics.
            Zero wearable lag. Millisecond precision mapped in real-time 3D.
          </p>

          {/* Action CTAs */}
          <div className="unseen-reveal flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/start"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-emerald-400 text-black font-medium text-sm tracking-wide hover:bg-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.35)] transition-all duration-300 hover:scale-[1.02]"
            >
              <span>Begin Baseline</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#science"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 bg-white/[0.03] hover:bg-white/[0.08] text-white/90 text-sm font-light transition-all duration-300"
            >
              <span>Explore Architecture</span>
            </a>
          </div>
        </div>

        {/* Floating Scroll Indicator */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity pointer-events-auto" data-scroll data-scroll-speed="-0.5">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase">Scroll to Explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* 4. Telemetry & Science Deep Dive */}
      <section id="science" className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-32" data-scroll>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div data-scroll data-scroll-speed="0.5">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400 mb-3 block">
              01 // Architectural Calibration
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight leading-tight mb-6">
              Precision metrics, <br />
              <span className="text-white/40">zero noise.</span>
            </h2>
            <p className="text-white/70 leading-relaxed font-light mb-8">
              Traditional wellness platforms rely on delayed questionnaires and superficial heart rate monitors. AQLA operates directly on prefrontal executive latency, vagal autonomic recovery, and hippocampal working memory retention.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md">
                <div className="text-2xl font-light text-white mb-1">±12ms</div>
                <div className="text-xs font-mono text-white/40">PVT-B Latency Precision</div>
              </div>
              <div className="p-4 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md">
                <div className="text-2xl font-light text-white mb-1">8 Domains</div>
                <div className="text-xs font-mono text-white/40">Holographic Neural Map</div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl" data-scroll data-scroll-speed="0.2">
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium">Real-Time Cortical Telemetry</span>
              </div>
              <span className="px-2.5 py-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-[10px] font-mono text-emerald-400">
                LIVE CDP
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-white/40">FRONTAL EXECUTIVE</div>
                  <div className="text-sm font-medium text-white">DLPFC Coherence Index</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-emerald-400">94.2%</div>
                  <div className="text-[10px] font-mono text-white/40">STABLE</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-white/40">WORKING MEMORY BUFFER</div>
                  <div className="text-sm font-medium text-white">Hippocampal Span</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-cyan-400">7.2 Digits</div>
                  <div className="text-[10px] font-mono text-white/40">OPTIMAL</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-white/40">AUTONOMIC TONE</div>
                  <div className="text-sm font-medium text-white">Vagal Parasympathetic Bounce</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-emerald-400">68ms HRV</div>
                  <div className="text-[10px] font-mono text-white/40">REBOUNDING</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. In-Situ Psychometric Lab */}
      <section id="telemetry" className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-24" data-scroll>
        <div className="text-center max-w-2xl mx-auto mb-16" data-scroll data-scroll-speed="0.4">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-400 mb-3 block">
            02 // Zero-Install Cognitive Sandbox
          </span>
          <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight leading-tight">
            Calibrate your reaction latency.
          </h2>
          <p className="mt-4 text-white/60 font-light">
            Test your psychomotor vigilance in this browser window before creating your profile.
          </p>
        </div>

        <div className="w-full bg-black/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl">
          <PsychometricMiniLab />
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-xl px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <AqlaLogo className="h-6 w-auto text-white" />
          <div className="text-xs font-mono text-white/40">
            AQLA COGNITIVE ARCHITECTURE // MOCKUP 4 UNSEEN CUT
          </div>
          <Link to="/start" className="text-xs font-mono text-emerald-400 hover:underline">
            COMMENCE BASELINE →
          </Link>
        </div>
      </footer>

      {/* 7. Collapsible Switcher Dock */}
      <MockupSwitcherDock />
    </div>
  );
}

export default function MockupFourUnseen() {
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
      <MockupFourContent />
    </LocoScrollProvider>
  );
}
