import React from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function GameCard({ game, best, plays, onPlay }) {
  const Icon = game.icon;
  return (
    <motion.button type="button" onClick={() => onPlay(game)} whileHover={{ y: -6, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative w-[228px] shrink-0 text-left aqla-panel rounded-2xl overflow-hidden">
      <div className={`h-28 relative overflow-hidden bg-gradient-to-br ${game.art}`}>
        <span className="absolute -left-5 -bottom-10 w-28 h-28 rounded-full border border-foreground/10" />
        <span className="absolute left-8 -bottom-16 w-32 h-32 rounded-full border border-foreground/5" />
        <Icon className={`absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 ${game.iconTone}`} strokeWidth={1.15} />
        <span className="absolute top-2.5 right-3 inline-flex items-center gap-1.5">
          {game.specialty && (
            <span className="rounded-full bg-primary/80 px-2 py-1 text-[9px] font-medium uppercase tracking-wide text-primary-foreground backdrop-blur-sm">Specialty</span>
          )}
          <span className="rounded-full bg-background/60 px-2 py-1 text-[10px] text-foreground tabular-nums backdrop-blur-sm">{game.minutes}</span>
        </span>
        <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-background/55">
          <Play className="w-7 h-7 text-foreground" strokeWidth={1.5} />
        </span>
      </div>
      <div className="px-4 py-3.5">
        <p className="font-display text-sm font-medium tracking-tight text-foreground">{game.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{game.trains}</p>
        <p className="text-[11px] text-muted-foreground/80 mt-2 leading-relaxed line-clamp-2">{game.desc}</p>
        <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground tabular-nums">
          <span>{best != null ? `Best ${best}` : "Not played"}</span>
          {plays > 0 && <span className="text-border">·</span>}
          {plays > 0 && <span>{plays} {plays === 1 ? "session" : "sessions"}</span>}
        </div>
      </div>
    </motion.button>
  );
}