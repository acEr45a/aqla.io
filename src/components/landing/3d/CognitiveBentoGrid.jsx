import React, { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Moon, Flame, Shield, Sparkles, BookOpen, Compass } from "lucide-react";

const DOMAINS_DATA = [
  {
    key: "focus",
    title: "Focus & Executive Control",
    colSpan: "col-span-12 md:col-span-8",
    rowSpan: "row-span-2",
    icon: Brain,
    score: 88,
    metricLabel: "DLPFC Coherence",
    metricValue: "0.89 r",
    desc: "Measured via SART commission suppression and sustained attention stability under sensory noise.",
    color: "#bef264",
    visual: "waveform",
  },
  {
    key: "reaction",
    title: "Psychomotor Speed",
    colSpan: "col-span-12 md:col-span-4",
    rowSpan: "row-span-1",
    icon: Zap,
    score: 94,
    metricLabel: "Mean PVT Latency",
    metricValue: "194 ms",
    desc: "Millisecond-precise response latency distribution across multi-stage trials.",
    color: "#38bdf8",
  },
  {
    key: "sleep",
    title: "Sleep Architecture & Recovery",
    colSpan: "col-span-12 md:col-span-4",
    rowSpan: "row-span-1",
    icon: Moon,
    score: 82,
    metricLabel: "Slow-Wave Delta Ratio",
    metricValue: "1.42",
    desc: "Deep sleep restorative consolidation mapped against autonomic recovery baselines.",
    color: "#a78bfa",
  },
  {
    key: "memory",
    title: "Working Memory Capacity",
    colSpan: "col-span-12 md:col-span-4",
    rowSpan: "row-span-1",
    icon: BookOpen,
    score: 79,
    metricLabel: "Digit Span Buffer",
    metricValue: "8.2 items",
    desc: "Phonological loop capacity and backward sequence retention accuracy.",
    color: "#f472b6",
  },
  {
    key: "resilience",
    title: "Cognitive Resilience",
    colSpan: "col-span-12 md:col-span-4",
    rowSpan: "row-span-1",
    icon: Shield,
    score: 91,
    metricLabel: "HRV Vagal Tone",
    metricValue: "68 ms",
    desc: "Physiological bounce-back rate following acute cognitive loading stresses.",
    color: "#34d399",
  },
  {
    key: "stress",
    title: "Autonomic Stress Regulation",
    colSpan: "col-span-12 md:col-span-4",
    rowSpan: "row-span-1",
    icon: Flame,
    score: 74,
    metricLabel: "Cortisol Slope Delta",
    metricValue: "-0.31",
    desc: "Circadian neuroendocrine buffering mapped to parasympathetic recovery.",
    color: "#fb923c",
  },
];

export default function CognitiveBentoGrid() {
  const [activeKey, setActiveKey] = useState(null);

  return (
    <section className="relative max-w-7xl mx-auto px-4 md:px-6 py-28 md:py-40">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <p className="text-xs font-mono text-[#bef264] tracking-widest uppercase mb-3">
          Neural Architecture
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-tight">
          Eight integrated domains. <br className="hidden sm:inline" />
          <span className="text-[#bef264]">Zero guesswork.</span>
        </h2>
        <p className="mt-4 text-base md:text-lg text-white/60 leading-relaxed">
          Traditional tests isolate a single variable. AQLA synthesizes psychometric speed, memory buffers, and autonomic regulation into one interconnected model.
        </p>
      </div>

      {/* Gapless Dense Bento Grid */}
      <div className="grid grid-cols-12 grid-flow-dense gap-4 md:gap-5">
        {DOMAINS_DATA.map((d) => {
          const Icon = d.icon;
          const isSelected = activeKey === d.key;

          return (
            <motion.div
              key={d.key}
              onMouseEnter={() => setActiveKey(d.key)}
              onMouseLeave={() => setActiveKey(null)}
              className={`relative rounded-3xl border p-6 md:p-8 flex flex-col justify-between overflow-hidden transition-all duration-500 backdrop-blur-xl group ${d.colSpan} ${d.rowSpan}`}
              style={{
                borderColor: isSelected ? `${d.color}60` : "rgba(255, 255, 255, 0.08)",
                backgroundColor: isSelected ? "rgba(10, 15, 12, 0.75)" : "rgba(8, 12, 10, 0.45)",
                boxShadow: isSelected ? `0 0 50px -10px ${d.color}25` : "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
              }}
            >
              {/* Subtle accent line at top */}
              <div
                className="absolute top-0 left-6 right-6 h-px transition-opacity duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${d.color}80, transparent)`,
                  opacity: isSelected ? 1 : 0.3,
                }}
              />

              {/* Top Row: Icon + Title + Score */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundColor: `${d.color}15`,
                      border: `1px solid ${d.color}35`,
                      color: d.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl font-light text-white">
                      {d.score}
                      <span className="text-xs text-white/40">/100</span>
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#bef264]/70">
                      Tier 1 Index
                    </div>
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-medium text-white mb-2 tracking-tight">
                  {d.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed max-w-xl">
                  {d.desc}
                </p>
              </div>

              {/* Focus Card Feature Visual (Large waveform & telemetry) */}
              {d.visual === "waveform" && (
                <div className="my-6 p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-3">
                    <span>Frontal Alpha/Theta Ratio Spectrum</span>
                    <span className="text-[#bef264]">Coherence: 94.8%</span>
                  </div>
                  {/* SVG Frequency wave */}
                  <svg className="w-full h-16 stroke-[#bef264] fill-none" viewBox="0 0 400 60">
                    <path
                      d="M0,30 Q20,10 40,30 T80,30 T120,15 T160,45 T200,20 T240,40 T280,10 T320,35 T360,25 T400,30"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0,30 Q20,20 40,30 T80,30 T120,25 T160,35 T200,28 T240,32 T280,20 T320,30 T360,28 T400,30"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      strokeOpacity="0.4"
                    />
                  </svg>
                </div>
              )}

              {/* Bottom Metric Strip */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-white/40">{d.metricLabel}</span>
                <span className="font-semibold text-white group-hover:text-[#bef264] transition-colors">
                  {d.metricValue}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
