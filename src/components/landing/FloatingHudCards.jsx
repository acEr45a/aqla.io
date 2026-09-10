import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Animated counter hook
function useCounter(target, duration = 1800, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const progress = Math.min(1, (Date.now() - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return value;
}

function PulseDot({ color = "#bef264" }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: color, animationDuration: "1.8s" }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
    </span>
  );
}

function HudCard({ title, value, unit, sub, color = "#bef264", delay = 0, className = "", style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative backdrop-blur-xl rounded-xl border bg-black/40 px-4 py-3 shadow-2xl select-none ${className}`}
      style={{
        borderColor: `${color}28`,
        boxShadow: `0 0 32px ${color}14, 0 2px 16px rgba(0,0,0,0.6)`,
        ...style
      }}
    >
      <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />
      <div className="flex items-center gap-2 mb-1.5">
        <PulseDot color={color} />
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: `${color}cc` }}>{title}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-white leading-none">{value}</span>
        {unit && <span className="text-xs font-mono" style={{ color }}>{unit}</span>}
      </div>
      {sub && <p className="mt-1.5 text-[10px] leading-snug" style={{ color: `${color}99` }}>{sub}</p>}
    </motion.div>
  );
}

export default function FloatingHudCards() {
  const rt = useCounter(215, 1600, 600);
  const cr = useCounter(96, 1800, 900);
  const sleep = useCounter(38, 2000, 1200);

  return (
    <>
      <div className="absolute top-16 right-0 w-52 z-10 pointer-events-none">
        <HudCard title="Reaction Latency" value={rt} unit="ms" sub="PVT-B Optimal // Top 4% percentile" color="#bef264" delay={0.4} />
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-52 z-10 pointer-events-none">
        <HudCard title="Cognitive Resilience" value={cr} unit="/100" sub="Prefrontal Stabilization Active" color="#5FD4E8" delay={0.7} />
      </div>
      <div className="absolute bottom-16 left-0 w-52 z-10 pointer-events-none">
        <HudCard title="Deep Sleep Delta" value={`+${sleep}`} unit="%" sub="RESET Protocol // Circadian Staging Active" color="#A78BFA" delay={1.0} />
      </div>
      <div className="absolute top-0 left-0 z-10 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#bef264]/20 bg-black/50 backdrop-blur-md"
        >
          <PulseDot color="#bef264" />
          <span className="text-[10px] font-mono text-[#bef264]/80 uppercase tracking-wider">AQLA OS v2.4 // LIVE</span>
        </motion.div>
      </div>
    </>
  );
}
