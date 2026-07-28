import React from "react";
import { motion } from "framer-motion";
import { rankProgress } from "@/lib/ranks";

// Floating glass callout anchored to a brain region — name, rank, and progress
// toward the next rank.
export default function RankCard({ domain, region, compact = false }) {
  const { rank, next, pct } = rankProgress(domain.score);

  return (
    <motion.div layout initial={{ opacity: 0, y: 8, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="rounded-2xl border px-4 py-3 min-w-[168px]"
      style={{
        background: "linear-gradient(150deg, rgba(20,19,17,0.92), rgba(14,13,12,0.82))",
        borderColor: `${rank.color}59`,
        boxShadow: `0 0 24px ${rank.color}26`,
        backdropFilter: "blur(10px)",
      }}>
      <p className="text-[11px] text-muted-foreground leading-none">{domain.label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-sm tracking-wide" style={{ color: rank.color }}>{rank.name}</span>
        <span className="font-display text-lg font-semibold text-foreground tabular-nums leading-none">{domain.score}</span>
      </div>

      {!compact && region && <p className="mt-1 text-[10px] text-muted-foreground/80">{region.region}</p>}

      <div className="mt-2.5 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.15 }}
          className="h-full rounded-full" style={{ background: rank.color, boxShadow: `0 0 8px ${rank.color}` }} />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        {next ? `${Math.round(pct * 100)}% to ${next.name}` : "Apex rank reached"}
      </p>
    </motion.div>
  );
}