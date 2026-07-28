import React from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function GameCard({ game, best, plays, onPlay }) {
  return (
    <motion.button type="button" onClick={() => onPlay(game)} whileHover={{ y: -6, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative w-[228px] shrink-0 text-left aqla-panel rounded-2xl overflow-hidden">
      <div className="h-28 relative overflow-hidden bg-secondary">
        <Image src={game.thumbnail} alt={`${game.name} game artwork`} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" fittingType="fill" />
        <span className="absolute inset-0 bg-gradient-to-t from-background/65 via-transparent to-background/20" />
        <span className="absolute top-2.5 right-3 rounded-full bg-background/75 px-2 py-1 text-[10px] text-foreground tabular-nums backdrop-blur-sm">{game.minutes}</span>
        <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-background/45">
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