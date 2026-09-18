import React from "react";
import { motion } from "framer-motion";
import { Activity, Zap, Radio, ShieldCheck } from "lucide-react";

export default function BiometricHudOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-8 flex flex-col justify-between z-20">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        {/* Top Left: Neural Telemetry Stream */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pointer-events-auto rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-xl shadow-2xl max-w-[210px]"
          style={{ boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)" }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#bef264] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#bef264]" />
            </span>
            <span className="font-mono text-[10px] tracking-widest text-white/50 uppercase">
              Synaptic Feed
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-light tracking-tight text-white font-mono">
              94.2<span className="text-xs text-[#bef264]">%</span>
            </span>
            <span className="text-[11px] text-[#bef264] font-mono">Alpha Synchrony</span>
          </div>
          <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#bef264] to-[#38bdf8] w-[94%]" />
          </div>
        </motion.div>

        {/* Top Right: Psychomotor Latency */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="pointer-events-auto rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-xl shadow-2xl max-w-[210px]"
          style={{ boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)" }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-mono text-[10px] tracking-widest text-[#38bdf8] uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#38bdf8]" /> PVT-B Instrument
            </span>
            <span className="text-[10px] text-white/40 font-mono">Task 01</span>
          </div>
          <div className="text-xl font-light text-white font-mono flex items-baseline gap-1">
            194 <span className="text-xs text-white/50">ms</span>
          </div>
          <div className="text-[10px] text-white/50 mt-1">
            Reaction latency variance: <span className="text-white font-mono">±8ms</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom Left: Frontal Cortical Load */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="pointer-events-auto rounded-2xl border border-[#bef264]/20 bg-black/40 p-3.5 backdrop-blur-xl shadow-2xl max-w-[230px]"
        >
          <div className="flex items-center gap-2 mb-1 text-[11px] text-white/70">
            <Activity className="w-3.5 h-3.5 text-[#bef264]" />
            <span>Prefrontal Executive Load</span>
          </div>
          <div className="text-[11px] text-white/50 leading-relaxed font-sans">
            Bilateral dorsolateral firing calibrated to sustained attention.
          </div>
        </motion.div>

        {/* Bottom Right: Circadian Phase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="pointer-events-auto rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-xl shadow-2xl max-w-[220px]"
        >
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="text-[11px] font-medium text-white">Circadian Clock</span>
          </div>
          <div className="font-mono text-xs text-[#bef264] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#bef264]" />
            Peak Focus Window
          </div>
          <div className="text-[10px] text-white/40 mt-1">Optimal cognitive throughput</div>
        </motion.div>
      </div>
    </div>
  );
}
