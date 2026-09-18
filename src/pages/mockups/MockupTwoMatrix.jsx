import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Activity, Radio, Shield, Brain, BookOpen, Clock, Play, RotateCcw, CheckCircle2, ChevronRight, Terminal, Cpu } from "lucide-react";
import { animate, stagger } from "animejs";
import AqlaLogo from "@/components/AqlaLogo";
import MockupSwitcherDock from "@/components/landing/mockups/MockupSwitcherDock";
import { LocoScrollProvider, useLocoScroll } from "@/lib/LocoScrollProvider";

const VolumetricNeuralCloudCanvas = lazy(() =>
  import("@/components/landing/3d/VolumetricNeuralCloudCanvas")
);

function CanvasFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#04070a] z-0">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#38bdf8] border-t-transparent animate-spin" />
        <span className="text-[11px] font-mono text-white/40 tracking-[0.25em] uppercase">
          Instantiating 22,000 Neural Particle Nodes...
        </span>
      </div>
    </div>
  );
}

const LAB_DOMAINS = [
  { id: "focus", title: "DLPFC Executive Focus", score: 92, hz: "10.4 Hz Alpha", test: "SART Inhibitory", color: "#bef264", desc: "Frontal beta-gamma synchrony gating distraction under auditory load." },
  { id: "memory", title: "Hippocampal Working Buffer", score: 86, hz: "6.2 Hz Theta", test: "Wechsler Digit Span", color: "#38bdf8", desc: "Short-term phonological loop limit and backward numerical sequence retention." },
  { id: "reaction", title: "Psychomotor Speed", score: 95, hz: "194 ms Latency", test: "PVT-B Protocol", color: "#bef264", desc: "Sub-second motor reaction speed variance across continuous 10-minute vigilance." },
  { id: "sleep", title: "Delta Wave Architecture", score: 81, hz: "1.2 Hz Delta", test: "Sleep Polysom", color: "#a78bfa", desc: "Slow-wave restorative sleep percentage mapping autonomic physical recovery." },
  { id: "resilience", title: "Vagal Autonomic Tone", score: 88, hz: "68 ms HRV", test: "Cold Pressor / HRV", color: "#34d399", desc: "Cardiovascular parasympathetic bounce-back rate following acute stress." },
  { id: "stress", title: "Cortisol Buffer Reserve", score: 79, hz: "-0.31 Slope", test: "Circadian Salivary", color: "#fb923c", desc: "Neuroendocrine diurnal cortisol slope buffering chronic allostatic load." },
];

function MockupTwoContent() {
  const scrollProgressRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("focus");
  const [digitState, setDigitState] = useState("idle");
  const [digits, setDigits] = useState([]);
  const [userSequence, setUserSequence] = useState("");
  const { instance, ready } = useLocoScroll();

  // Bind Locomotive Scroll v5 instance for continuous momentum tracking
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

  // Native window scroll listener fallback
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    animate(".cyber-fade", {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: stagger(100, { start: 150 }),
      duration: 800,
      easing: "easeOutExpo",
    });
  }, []);

  const startMemoryTest = () => {
    const seq = Array.from({ length: 6 }, () => Math.floor(Math.random() * 9) + 1);
    setDigits(seq);
    setUserSequence("");
    setDigitState("memorizing");

    setTimeout(() => {
      setDigitState("recalling");
    }, 3200);
  };

  const handleDigitSubmit = (e) => {
    e.preventDefault();
    if (userSequence.trim() === digits.join("")) {
      setDigitState("success");
    } else {
      setDigitState("idle");
      alert("Sequence mismatch. Working memory span recalibrating. Try again!");
    }
  };

  const activeDomainData = LAB_DOMAINS.find((d) => d.id === activeTab) || LAB_DOMAINS[0];

  return (
    <div className="relative min-h-screen bg-[#04070a] text-white selection:bg-[#38bdf8] selection:text-black font-sans overflow-x-hidden">
      {/* ── 1. FULL-BLEED 22,000 VOLUMETRIC POINT CLOUD STAGE (PERSISTENT FIXED VIEWPORT) ── */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <Suspense fallback={<CanvasFallback />}>
          <VolumetricNeuralCloudCanvas scrollProgress={scrollProgressRef} />
        </Suspense>
      </div>

      {/* Ambient Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* ── 2. MINIMALIST TOP CORNER HUDS ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-6 pointer-events-auto backdrop-blur-md bg-[#04070a]/50 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <AqlaLogo className="h-6 w-auto text-white" />
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-[11px] font-mono text-white/50 tracking-[0.2em]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8] animate-ping" />
            <span>22,000 NODES // VOLUMETRIC CDP ACTIVE</span>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-xs font-mono tracking-widest uppercase">
          <a href="#matrix" className="text-white/60 hover:text-white transition-colors">
            Matrix
          </a>
          <a href="#memory-lab" className="text-white/60 hover:text-white transition-colors">
            Memory Trial
          </a>
          <Link to="/login" className="text-white/60 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            to="/start"
            className="px-5 py-2 rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/10 hover:bg-[#38bdf8] hover:text-black text-[#38bdf8] transition-all duration-300 font-semibold shadow-[0_0_16px_rgba(56,189,248,0.2)]"
          >
            Launch Baseline
          </Link>
        </nav>
      </header>

      {/* ── 3. FULL-BLEED INTERACTIVE STAGE HERO WITH RADIAL CONTRAST SCRIM ── */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center items-center px-6 text-center pt-24 pb-20 pointer-events-none">
        {/* Crisp text wrapper with ambient frosted dark scrim */}
        <div
          className="max-w-4xl mx-auto flex flex-col items-center pointer-events-auto relative px-8 sm:px-12 py-10 rounded-3xl backdrop-blur-[8px] bg-[#04070a]/60 border border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.85)]"
          data-scroll
          data-scroll-speed="0.8"
        >
          {/* Status Chip */}
          <div className="cyber-fade inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/15 backdrop-blur-xl mb-6 text-[#38bdf8] text-xs font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="tracking-[0.2em] uppercase">GRAVITATIONAL NEURAL FIELD</span>
          </div>

          {/* Headline */}
          <h1 className="cyber-fade text-5xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-light tracking-[-0.035em] text-white leading-[1.04] mb-6 drop-shadow-md">
            The neural field, in <br />
            <span className="font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#7dd3fc] to-[#bef264]">
              22,000 points of light.
            </span>
          </h1>

          {/* Subtitle with interactive hint */}
          <p className="cyber-fade max-w-xl text-base sm:text-lg text-white/80 font-light leading-relaxed mb-8">
            Cursor gravity active. Move your pointer across the screen to attract and ripple the neural particle cloud in real-time.
          </p>

          {/* Action Buttons */}
          <div className="cyber-fade flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/start"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#38bdf8] text-black font-semibold text-sm tracking-wide hover:bg-[#7dd3fc] shadow-[0_0_35px_rgba(56,189,248,0.4)] transition-all duration-300 hover:scale-[1.02]"
            >
              <span>Launch Free Lab Baseline</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#memory-lab"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-all duration-300"
            >
              <span>Test Memory Trial</span>
            </a>
          </div>
        </div>

        {/* Bottom Corner HUD Details */}
        <div className="absolute bottom-10 left-6 md:left-12 flex items-center gap-4 text-xs font-mono text-white/50 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>RENDER ENGINE: WEBGL2</span>
          </div>
          <span>|</span>
          <div>LATENCY: &lt;1ms</div>
        </div>
      </section>

      {/* ── 4. INTERACTIVE WECHSLER DIGIT SPAN SANDBOX ── */}
      <section id="memory-lab" className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-32" data-scroll>
        <div className="p-8 md:p-14 rounded-3xl border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl" data-scroll data-scroll-speed="0.4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#38bdf8] tracking-[0.2em] uppercase mb-2">
                <Brain className="w-4 h-4" /> Wechsler Working Memory Protocol
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-white">6-Digit Numerical Sequence Retention</h2>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-mono text-white/60">
                TASK DURATION: ~8 SECONDS
              </span>
            </div>
          </div>

          {/* Interactive Memory State Machine */}
          <div className="py-8 flex flex-col items-center justify-center">
            {digitState === "idle" && (
              <div className="text-center">
                <p className="text-white/70 text-sm max-w-md mx-auto mb-6">
                  Six randomized digits will flash for 3.2 seconds. Memorize the sequence, then enter it into the buffer.
                </p>
                <button
                  type="button"
                  onClick={startMemoryTest}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold text-black bg-[#38bdf8] hover:bg-[#7dd3fc] shadow-[0_0_24px_rgba(56,189,248,0.35)] transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Start Memory Trial</span>
                </button>
              </div>
            )}

            {digitState === "memorizing" && (
              <div className="text-center">
                <div className="text-xs font-mono text-[#38bdf8] tracking-widest uppercase mb-4 animate-pulse">
                  MEMORIZING SEQUENCE (WINDOW CLOSING...)
                </div>
                <div className="flex items-center justify-center gap-3">
                  {digits.map((d, i) => (
                    <div
                      key={i}
                      className="w-12 h-14 rounded-2xl border border-[#38bdf8]/50 bg-[#38bdf8]/10 flex items-center justify-center text-2xl font-mono text-[#38bdf8] font-bold shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {digitState === "recalling" && (
              <form onSubmit={handleDigitSubmit} className="text-center w-full max-w-xs">
                <div className="text-xs font-mono text-white/60 tracking-widest uppercase mb-3">
                  INPUT DIGIT SEQUENCE
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={userSequence}
                  onChange={(e) => setUserSequence(e.target.value)}
                  placeholder="------"
                  autoFocus
                  className="w-full tracking-[0.5em] text-center text-3xl font-mono py-3 rounded-2xl border border-white/20 bg-black/60 text-white focus:border-[#38bdf8] focus:outline-none focus:ring-1 focus:ring-[#38bdf8] mb-4"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-full text-xs font-semibold text-black bg-[#38bdf8] hover:bg-[#7dd3fc] shadow-lg transition-all"
                >
                  Verify Memory Trace
                </button>
              </form>
            )}

            {digitState === "success" && (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border border-emerald-400/40 bg-emerald-400/10 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Memory Span Confirmed: 6 Digits</h3>
                <p className="text-xs font-mono text-emerald-400 mb-6">RETENTION ACCURACY: 100% // TIER 1 BANDWIDTH</p>
                <button
                  type="button"
                  onClick={() => setDigitState("idle")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-xs font-mono text-white/70 hover:text-white transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Test Again</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. 8-DOMAIN INTERACTIVE MATRIX SECTION ── */}
      <section id="matrix" className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-24" data-scroll>
        <div className="p-8 md:p-14 rounded-3xl border border-white/10 bg-[#04070a]/85 backdrop-blur-2xl shadow-2xl" data-scroll data-scroll-speed="0.4">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-mono text-[#bef264] tracking-[0.2em] uppercase mb-3">
              STAGE 02 // MULTI-SPECTRAL DOMAINS
            </div>
            <h2 className="text-4xl sm:text-5xl font-light text-white leading-tight">
              The 8 dimensions of <br />
              <span className="text-[#38bdf8]">cognitive bandwidth.</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left: Domain Selector Buttons */}
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              {LAB_DOMAINS.map((domain) => {
                const isSelected = domain.id === activeTab;
                return (
                  <button
                    key={domain.id}
                    onClick={() => setActiveTab(domain.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl text-left border transition-all duration-300 ${
                      isSelected
                        ? "border-[#38bdf8]/50 bg-[#38bdf8]/15 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                        : "border-white/5 bg-black/50 hover:border-white/20 text-white/60 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className={`text-sm font-medium ${isSelected ? "text-white" : "text-white/80"}`}>
                        {domain.title}
                      </div>
                      <div className="text-[11px] font-mono text-white/40 mt-0.5">
                        {domain.test}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "translate-x-1 text-[#38bdf8]" : "opacity-30"}`} />
                  </button>
                );
              })}
            </div>

            {/* Right: Active Domain Telemetry Card */}
            <div className="lg:col-span-7 p-8 md:p-10 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <span className="text-xs font-mono uppercase tracking-widest text-[#38bdf8]">
                  {activeDomainData.hz}
                </span>
                <span className="text-2xl font-light text-white">
                  {activeDomainData.score}<span className="text-xs font-mono text-white/40">/100</span>
                </span>
              </div>

              <h3 className="text-2xl font-light text-white mb-4">
                {activeDomainData.title}
              </h3>
              <p className="text-white/70 text-sm font-light leading-relaxed mb-8">
                {activeDomainData.desc}
              </p>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between">
                <span className="text-xs font-mono text-white/50">VALIDATED LAB REFERENCE</span>
                <span className="text-xs font-mono text-[#bef264]">{activeDomainData.test}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 bg-black/90 backdrop-blur-xl px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <AqlaLogo className="h-6 w-auto text-white" />
          <div className="text-xs font-mono text-white/50">
            AQLA COGNITIVE NEURAL FIELD // MOCKUP 2 MATRIX
          </div>
          <Link to="/start" className="text-xs font-mono text-[#38bdf8] hover:underline">
            COMMENCE PROTOCOL →
          </Link>
        </div>
      </footer>

      {/* ── 7. COLLAPSIBLE SWITCHER DOCK ── */}
      <MockupSwitcherDock />
    </div>
  );
}

export default function MockupTwoMatrix() {
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
      <MockupTwoContent />
    </LocoScrollProvider>
  );
}
