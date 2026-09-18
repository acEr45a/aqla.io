import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Sunset, Moon, Clock, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";

const PROTOCOLS = [
  {
    phase: "morning",
    icon: Sun,
    title: "Morning Cortisol Synchronization",
    time: "07:00 – 08:30",
    color: "#bef264",
    headline: "Light-gated circadian resetting & dopamine priming",
    actions: [
      { name: "Lux-gated Lux Exposure", spec: "10,000 lux within 30 min of waking", evidence: "Huberman & Panda (2022)" },
      { name: "Delayed Adenosine Clearance", spec: "90 min caffeine buffer to prevent afternoon crash", evidence: "Nehlig et al. (2018)" },
      { name: "Hydration & Electrolyte Stack", spec: "500ml H2O with 400mg sodium / 200mg potassium", evidence: "Armstrong et al. (2012)" },
    ],
  },
  {
    phase: "focus",
    icon: Clock,
    title: "Peak Executive Focus Window",
    time: "09:30 – 12:30",
    color: "#38bdf8",
    headline: "Ultradian 90-minute sustained attention blocks",
    actions: [
      { name: "Binaural 40Hz Gamma Entrainment", spec: "Gamma auditory pulses to sharpen prefrontal signal-to-noise ratio", evidence: "Ross et al. (2021)" },
      { name: "Alpha-GPC + L-Tyrosine Matrix", spec: "300mg acetylcholine precursor for executive bandwidth", evidence: "Marcus et al. (2017)" },
      { name: "Eye Vergence Rest Break", spec: "20-20-20 visual relaxation every 90 minutes", evidence: "Golebiowski et al. (2020)" },
    ],
  },
  {
    phase: "evening",
    icon: Moon,
    title: "Parasympathetic Down-Regulation",
    time: "21:30 – 23:00",
    color: "#a78bfa",
    headline: "Melatonin synthesis gating & slow-wave delta preparation",
    actions: [
      { name: "Melanopic Blue-Light Cutoff", spec: "<10 lux warm spectrum lighting 2h before bedtime", evidence: "Chang et al. (2015)" },
      { name: "Magnesium L-Threonate Stack", spec: "140mg elemental magnesium crossing blood-brain barrier", evidence: "Slutsky et al. (2010)" },
      { name: "Autonomic Sigh Protocol", spec: "5 minutes physiological cyclic sighing to reduce heart rate", evidence: "Balban et al. (2023)" },
    ],
  },
];

export default function CircadianProtocolStack() {
  const [selectedPhase, setSelectedPhase] = useState("morning");
  const activeProtocol = PROTOCOLS.find((p) => p.phase === selectedPhase) || PROTOCOLS[0];

  return (
    <section className="relative max-w-7xl mx-auto px-4 md:px-6 py-28 md:py-40">
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Context and Tab Selection */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#bef264]/20 bg-[#bef264]/5 text-[#bef264] text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Dynamic Protocol Engine
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-tight">
            Interventions timed to your <span className="text-[#bef264]">circadian curve.</span>
          </h2>

          <p className="mt-6 text-base md:text-lg text-white/60 leading-relaxed">
            Generic advice tells you what to take. AQLA orchestrates exactly when, how, and why each behavioral and nutritional lever interacts with your neural clock.
          </p>

          {/* Phase Selector Tabs */}
          <div className="mt-8 space-y-3">
            {PROTOCOLS.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPhase === p.phase;
              return (
                <button
                  key={p.phase}
                  onClick={() => setSelectedPhase(p.phase)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                    isSelected
                      ? "border-[#bef264]/50 bg-[#bef264]/10 shadow-[0_0_24px_rgba(190,242,100,0.12)]"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? `${p.color}25` : "rgba(255,255,255,0.05)",
                        color: isSelected ? p.color : "rgba(255,255,255,0.6)",
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{p.title}</div>
                      <div className="text-xs font-mono text-white/50">{p.time}</div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isSelected ? "text-[#bef264] translate-x-1" : "text-white/20"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Phase Deep Card */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProtocol.phase}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="relative p-8 md:p-10 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl overflow-hidden"
              style={{
                boxShadow: `0 20px 60px -20px ${activeProtocol.color}20`,
              }}
            >
              {/* Accent top gradient line */}
              <div
                className="absolute top-0 left-8 right-8 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${activeProtocol.color}80, transparent)`,
                }}
              />

              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <span
                    className="inline-block text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full border mb-2"
                    style={{
                      borderColor: `${activeProtocol.color}30`,
                      backgroundColor: `${activeProtocol.color}10`,
                      color: activeProtocol.color,
                    }}
                  >
                    Phase Window · {activeProtocol.time}
                  </span>
                  <h3 className="text-2xl font-light text-white tracking-tight">
                    {activeProtocol.headline}
                  </h3>
                </div>
              </div>

              {/* Protocol Actions Stack */}
              <div className="space-y-4 mt-6">
                {activeProtocol.actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${activeProtocol.color}15`,
                          color: activeProtocol.color,
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{act.name}</div>
                        <div className="text-xs text-white/60 mt-1 leading-relaxed">{act.spec}</div>
                        <div className="mt-2 text-[10px] font-mono text-white/40 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          Clinical Source: {act.evidence}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/40 font-mono">
                <span>Personalized against your 8-domain baseline</span>
                <span className="text-[#bef264]">No static templates</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
