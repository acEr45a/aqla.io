import React from "react";
import { Lock } from "lucide-react";

export default function ComingSoonCard({ game }) {
  const Icon = game.icon;
  return (
    <div className="relative w-[228px] shrink-0 aqla-panel rounded-2xl overflow-hidden opacity-80">
      <div className={`h-28 relative overflow-hidden bg-gradient-to-br ${game.art}`}>
        <span className="absolute -left-5 -bottom-10 w-28 h-28 rounded-full border border-foreground/10" />
        <Icon className={`absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 ${game.iconTone}`} strokeWidth={1.15} />
        <span className="absolute top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
          <Lock className="w-2.5 h-2.5" /> Soon
        </span>
      </div>
      <div className="px-4 py-3.5">
        <p className="font-display text-sm font-medium tracking-tight text-foreground">{game.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{game.trains}</p>
        <p className="text-[11px] text-muted-foreground/80 mt-2 leading-relaxed line-clamp-2">{game.desc}</p>
        <p className="mt-3 text-[10px] text-muted-foreground">In development</p>
      </div>
    </div>
  );
}