import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Compass, Sun, Moon, Clock, ShieldCheck, ChevronRight, Check, Award, BookOpen } from "lucide-react";
import { animate } from "animejs";
import AqlaLogo from "@/components/AqlaLogo";
import MockupSwitcherDock from "@/components/landing/mockups/MockupSwitcherDock";
import { LocoScrollProvider } from "@/lib/LocoScrollProvider";

const CIRCADIAN_HOURS = [
  {
    hour: "07:00",
    title: "Circadian Awakening Response",
    tag: "Morning Prime",
    headline: "Retinal photon calibration & adenosine clearance",
    action: "10,000 lux natural photon stimulus within 30 min of waking. 90-minute delayed caffeine buffer to prevent afternoon receptor crashes.",
    evidence: "Huberman Lab & Panda (2022) · Cell Metabolism",
    compounds: [
      { name: "Sodium / Potassium Electrolytes", dose: "500mg Na / 200mg K", role: "Hydration & neuronal action potential firing" },
      { name: "L-Tyrosine Matrix", dose: "500mg", role: "Dopamine & noradrenaline synthesis precursor" },
    ],
  },
  {
    hour: "10:30",
    title: "Peak Executive Throughput",
    tag: "Focus Block",
    headline: "Ultradian 90-minute sustained deep-work sprint",
    action: "Deep focus window calibrated to circadian core temperature elevation. Binaural 40Hz auditory stimulus to sharpen frontal signal-to-noise ratio.",
    evidence: "Marcus et al. (2017) · Neurobiology of Learning",
    compounds: [
      { name: "Alpha-GPC", dose: "300mg", role: "Acetylcholine neurotransmission buffer" },
      { name: "Rhodiola Rosea (3% Salidroside)", dose: "200mg", role: "Cognitive fatigue resistance under acute load" },
    ],
  },
  {
    hour: "14:30",
    title: "Postprandial Reset Dip",
    tag: "Autonomic Reset",
    headline: "Parasympathetic deceleration & stress recovery",
    action: "20-minute Non-Sleep Deep Rest (NSDR) or physiological cyclic sighing (two inhalations through nose, long exhalation through mouth) to down-regulate heart rate.",
    evidence: "Balban et al. (2023) · Cell Reports Medicine",
    compounds: [
      { name: "L-Theanine", dose: "100mg", role: "Promotes alpha wave relaxation without sedation" },
    ],
  },
  {
    hour: "21:30",
    title: "Melatonin Precursor Gating",
    tag: "Evening Downregulation",
    headline: "Delta slow-wave sleep architecture preparation",
    action: "Melanopic blue-spectrum cutoff (<10 lux warm ambient lighting). Cortisol clearance protocol to facilitate uninterrupted stage 3 slow-wave sleep.",
    evidence: "Slutsky et al. (2010) · Neuron",
    compounds: [
      { name: "Magnesium L-Threonate", dose: "145mg elemental", role: "Crosses blood-brain barrier for synaptic density" },
      { name: "Apigenin", dose: "50mg", role: "Binds GABA-A receptors for natural sleep onset" },
    ],
  },
];

function MockupThreeContent() {
  const [activeHourIndex, setActiveHourIndex] = useState(0);
  const clockDialRef = useRef(null);

  useEffect(() => {
    if (clockDialRef.current) {
      animate(clockDialRef.current, {
        rotate: activeHourIndex * 90,
        duration: 850,
        easing: "easeOutElastic(1, .8)",
      });
    }
  }, [activeHourIndex]);

  const activeStage = CIRCADIAN_HOURS[activeHourIndex];

  return (
    <div className="relative min-h-screen bg-[#060b08] text-white selection:bg-[#bef264] selection:text-black font-sans pb-32 overflow-x-hidden">
      {/* Ambient Forest Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 65% 50% at 50% 20%, rgba(14, 38, 25, 0.7) 0%, transparent 80%)",
          }}
        />
      </div>

      {/* Top Nav */}
      <header className="sticky top-6 z-50 max-w-5xl mx-auto px-4">
        <nav className="flex items-center justify-between px-6 py-3.5 rounded-full border border-white/10 bg-black/75 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <AqlaLogo className="text-white scale-90 origin-left" />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bef264]" />
              <span className="text-[11px] font-mono text-white/50 tracking-wider uppercase">
                Mockup 3 // Clinical Luxury
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs text-white/70 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              to="/start"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold text-black bg-[#bef264] hover:bg-[#d9f99d] shadow-[0_0_20px_rgba(190,242,100,0.3)] transition-all"
            >
              <span>Begin Baseline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#bef264]/20 bg-[#bef264]/5 text-xs font-mono text-[#bef264] mb-8">
          <Award className="w-3.5 h-3.5" />
          <span>CLINICAL EVIDENCE-GRADE BIO-ARCHITECT</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.08] text-white">
          Cognitive longevity, <br />
          <span className="italic font-serif text-[#bef264]">mastered around your clock.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-white/60 font-light max-w-2xl mx-auto leading-relaxed">
          The first neural performance system built on gold-standard psychometrics and circadian neuro-endocrinology.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/start"
            className="px-8 py-4 rounded-full font-medium text-sm text-black bg-[#bef264] hover:bg-[#d9f99d] shadow-[0_0_30px_rgba(190,242,100,0.3)] transition-all hover:scale-[1.02]"
          >
            Start Free Baseline Assessment
          </Link>
          <a
            href="#protocol"
            className="px-8 py-4 rounded-full border border-white/15 bg-white/[0.02] hover:bg-white/[0.05] text-sm text-white/80 font-light transition-all"
          >
            Explore Circadian Protocols
          </a>
        </div>
      </section>

      {/* ── INTERACTIVE CIRCADIAN CLOCK EXPERIENCE ── */}
      <section id="protocol" className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-12" data-scroll>
        <div className="p-8 md:p-14 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl" data-scroll data-scroll-speed="0.3">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Interactive Circular Dial */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-white/10 flex items-center justify-center p-4">
                {/* Dial Hour Markers */}
                {CIRCADIAN_HOURS.map((h, i) => {
                  const angle = (i * 90 - 90) * (Math.PI / 180);
                  const radius = 120;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const isSelected = i === activeHourIndex;

                  return (
                    <button
                      key={h.hour}
                      onClick={() => setActiveHourIndex(i)}
                      className={`absolute flex flex-col items-center justify-center transition-all duration-300 ${
                        isSelected
                          ? "scale-110 z-20"
                          : "opacity-40 hover:opacity-80 scale-95"
                      }`}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-mono text-xs border transition-all ${
                          isSelected
                            ? "bg-[#bef264] text-black border-[#bef264] shadow-[0_0_20px_rgba(190,242,100,0.5)] font-bold"
                            : "bg-black/70 text-white border-white/20"
                        }`}
                      >
                        {h.hour}
                      </div>
                      <span className="text-[10px] font-mono mt-1 text-white/60">
                        {h.tag}
                      </span>
                    </button>
                  );
                })}

                {/* Rotating Center Needle */}
                <div
                  ref={clockDialRef}
                  className="w-16 h-16 rounded-full border border-[#bef264]/40 bg-[#bef264]/10 flex items-center justify-center"
                >
                  <Clock className="w-6 h-6 text-[#bef264]" />
                </div>
              </div>
              <span className="text-[11px] font-mono text-white/40 tracking-wider uppercase mt-4">
                Click time node to inspect stage
              </span>
            </div>

            {/* Right: Protocol Card for Active Hour */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full border border-[#bef264]/30 bg-[#bef264]/10 text-xs font-mono text-[#bef264]">
                  {activeStage.hour} // {activeStage.tag}
                </span>
                <span className="text-xs font-mono text-white/40">CALIBRATED PROTOCOL</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-light text-white mt-4">
                {activeStage.title}
              </h2>
              <div className="text-sm font-mono text-[#bef264] mt-1">
                {activeStage.headline}
              </div>

              <p className="mt-4 text-sm text-white/70 font-light leading-relaxed">
                {activeStage.action}
              </p>

              {/* Verified Compounds Stack */}
              <div className="mt-6 space-y-2.5">
                <div className="text-xs font-mono text-white/40 uppercase">Evidence-Informed Protocol Stack:</div>
                {activeStage.compounds.map((c, idx) => (
                  <div key={idx} className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-white">{c.name}</div>
                      <div className="text-white/50 text-[11px] mt-0.5">{c.role}</div>
                    </div>
                    <div className="font-mono text-[#bef264] shrink-0 ml-2">{c.dose}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 text-xs font-mono text-white/50">
                <ShieldCheck className="w-4 h-4 text-[#bef264]" />
                <span>Clinical Citation: {activeStage.evidence}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GRADED EVIDENCE PASSPORT ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-16" data-scroll>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-white">Graded scientific evidence</h2>
          <p className="text-sm text-white/60 mt-2">Every recommendation is backed by peer-reviewed clinical literature.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { metric: "100%", label: "Literature Transparent", desc: "No proprietary secret blends. Full clinical dosages and PubMed IDs displayed." },
            { metric: "7 Tasks", label: "Validated Neuro-Psychology", desc: "Psychomotor vigilance (PVT-B), Wechsler digit span, SART sustained attention." },
            { metric: "0 Devices", label: "Zero Hardware Friction", desc: "Built for any modern browser. No rings, watches, or sensors required." },
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="text-3xl font-light text-[#bef264] font-mono">{item.metric}</div>
              <div className="text-base font-medium text-white mt-2">{item.label}</div>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Docked Switcher */}
      <MockupSwitcherDock />
    </div>
  );
}

export default function MockupThreeLuxury() {
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
      <MockupThreeContent />
    </LocoScrollProvider>
  );
}
