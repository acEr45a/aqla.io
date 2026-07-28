import React from "react";
import { motion } from "framer-motion";

// A score node pinned to a brain region: circular progress ring + pulse + label.
export default function BrainMarker({ anatomy, domain, active, onSelect, onHover, delay = 0 }) {
  const R = 15, C = 2 * Math.PI * R;
  const labelBelow = anatomy.side === "bottom";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${anatomy.x}%`, top: `${anatomy.y}%`, cursor: onSelect ? "pointer" : "default" }}
      onClick={() => onSelect && onSelect(domain)}
      onMouseEnter={() => onHover(anatomy.key)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="relative flex flex-col items-center">
        <svg width="44" height="44" viewBox="0 0 44 44" className="drop-shadow-lg">
          <circle cx="22" cy="22" r={R} fill="hsl(26 14% 6% / 0.72)" stroke="hsl(30 9% 24%)" strokeWidth="1" />
          <motion.circle cx="22" cy="22" r={R} fill="none" stroke={domain.color} strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray={C} transform="rotate(-90 22 22)"
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - domain.score / 100) }}
            transition={{ duration: 1.2, delay: delay + 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <text x="22" y="26" textAnchor="middle" fill={active ? domain.color : "hsl(40 24% 93%)"}
            fontSize="12" fontWeight="600" fontFamily="Space Grotesk" className="tabular-nums">
            {domain.score}
          </text>
        </svg>
        {active && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: domain.color }} />
        )}
        <div className={`absolute ${labelBelow ? "top-full mt-1" : "bottom-full mb-1"} whitespace-nowrap text-center pointer-events-none`}>
          <p className={`text-[11px] leading-tight transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>{domain.label}</p>
          {active && <p className="text-[10px] leading-tight" style={{ color: domain.color }}>{anatomy.region}</p>}
        </div>
      </div>
    </motion.div>
  );
}