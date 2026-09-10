import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Eye, Layers, Brain, Shuffle, Box, MessageSquareText, ShieldCheck } from "lucide-react";

const DOMAINS = [
  {
    key: "focus", label: "Focus", color: "#7B94FF",
    icon: Eye, score: 28,
    paradigm: "PVT-B // SART",
    protocol: "Deep work blocks: 90-min AM session. Zero notifications. Cold-start routine.",
    citation: "Sustained Attention (SART; Robertson et al., 1997)",
  },
  {
    key: "memory", label: "Memory", color: "#A9B9FF",
    icon: Layers, score: 43,
    paradigm: "Wechsler Digit Span",
    protocol: "Spaced repetition (Anki) + acetylcholine support: Alpha-GPC 300mg pre-task.",
    citation: "Wechsler Memory Scale — Forward & Backward Recall",
  },
  {
    key: "mental_energy", label: "Mental Energy", color: "#C9F24E",
    icon: Zap, score: 57,
    paradigm: "Reaction Velocity",
    protocol: "Circadian alignment: first light within 30 min of wake. No caffeine before 9:30AM.",
    citation: "Brief Psychomotor Vigilance Task (Dinges & Powell, 1985)",
  },
  {
    key: "stress_regulation", label: "Stress Regulation", color: "#F2C04E",
    icon: ShieldCheck, score: 71,
    paradigm: "Heart-Brain Axis",
    protocol: "4-7-8 breath protocol 2x daily. Magnesium glycinate 400mg PM.",
    citation: "HRV Autonomic Balance Index",
  },
  {
    key: "sleep_recovery", label: "Sleep Recovery", color: "#5FD4E8",
    icon: Brain, score: 85,
    paradigm: "Circadian Staging",
    protocol: "RESET protocol: consistent 22:30 lights-off, 18°C room, blackout, magnesium.",
    citation: "Oura Ring / PSG Deep Sleep Staging",
  },
  {
    key: "cognitive_resilience", label: "Cognitive Resilience", color: "#8FE8C2",
    icon: Shuffle, score: 96,
    paradigm: "Neuroplasticity Index",
    protocol: "Novelty-driven learning: 30-min daily skill acquisition + aerobic exercise.",
    citation: "BDNF / Neuroplasticity composite",
  },
  {
    key: "lifestyle_protection", label: "Lifestyle Protection", color: "#D9D4C5",
    icon: Box, score: 67,
    paradigm: "Biomarker Composite",
    protocol: "Mediterranean-MIND diet. 3+ liters H₂O. Alcohol minimization.",
    citation: "Lifestyle Medicine Cognitive Protection Score",
  },
  {
    key: "learning_capacity", label: "Learning Capacity", color: "#E8A28F",
    icon: MessageSquareText, score: 82,
    paradigm: "Task Switching // Cognitive Flex",
    protocol: "Interleaved practice. Dual-language exposure. Varied problem domains.",
    citation: "Task Switching Paradigm (Monsell, 2003)",
  },
];

function ScoreArc({ score, color }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle
        cx="24" cy="24" r={r} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)" }}
      />
      <text x="24" y="28" textAnchor="middle" className="text-[10px] font-bold fill-white" fontSize="10" fontWeight="bold" fill="white">{score}</text>
    </svg>
  );
}

export default function DomainHolographicExplorer() {
  const [active, setActive] = useState(null);
  const activeDomain = active !== null ? DOMAINS[active] : null;

  return (
    <div className="relative">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#bef264]/30 bg-[#bef264]/5 text-[#bef264] text-xs font-mono uppercase tracking-widest mb-4"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#bef264] animate-pulse" />
          8-Domain Neural Architecture
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-5xl font-light text-white leading-tight"
        >
          Your brain is a&nbsp;
          <span className="text-[#bef264]">multi-domain system.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          AQLA maps 8 distinct cognitive and lifestyle domains using validated psychometric
          paradigms from Oxford, Stanford, and Harvard. Hover any domain to see your targeted protocol.
        </motion.p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
        {DOMAINS.map((domain, i) => {
          const Icon = domain.icon;
          const isActive = active === i;
          return (
            <motion.button
              key={domain.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(isActive ? null : i)}
              className="relative group text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: isActive ? `${domain.color}10` : "rgba(0,0,0,0.3)",
                borderColor: isActive ? `${domain.color}50` : "rgba(255,255,255,0.06)",
                boxShadow: isActive ? `0 0 40px ${domain.color}18, 0 0 0 1px ${domain.color}30` : "none",
                backdropFilter: "blur(16px)",
              }}
            >
              {/* Top glow line */}
              <div
                className="absolute top-0 left-3 right-3 h-px transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${domain.color}, transparent)`,
                  opacity: isActive ? 0.8 : 0.15,
                }}
              />

              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-2 rounded-lg transition-colors duration-300"
                  style={{ backgroundColor: isActive ? `${domain.color}20` : "rgba(255,255,255,0.04)" }}
                >
                  <Icon className="w-4 h-4 transition-colors duration-300" style={{ color: isActive ? domain.color : "rgba(255,255,255,0.4)" }} />
                </div>
                <ScoreArc score={domain.score} color={domain.color} />
              </div>

              <p className="text-xs font-semibold text-white/90 leading-tight mb-1">{domain.label}</p>
              <p className="text-[10px] font-mono text-white/30">{domain.paradigm}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Protocol reveal panel */}
      <AnimatePresence mode="wait">
        {activeDomain && (
          <motion.div
            key={activeDomain.key}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-5 rounded-2xl border backdrop-blur-xl"
            style={{
              backgroundColor: `${activeDomain.color}08`,
              borderColor: `${activeDomain.color}30`,
              boxShadow: `0 0 48px ${activeDomain.color}10`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-6 rounded-full" style={{ backgroundColor: activeDomain.color }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: activeDomain.color }}>
                Targeted Protocol
              </span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed mb-3">{activeDomain.protocol}</p>
            <p className="text-[10px] font-mono text-white/30 italic">Validated paradigm: {activeDomain.citation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
