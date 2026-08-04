import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard from "./GameCard";

export default function GameRow({ category, games, stats, ratings, onPlay }) {
  const rail = useRef(null);
  const scroll = (dir) => rail.current?.scrollBy({ left: dir * 480, behavior: "smooth" });

  if (!games.length) return null;
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4 px-5 md:px-10">
        <div>
          <h2 className="font-display text-lg md:text-xl font-medium tracking-tight text-foreground">{category.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{category.blurb}</p>
        </div>
        <div className="hidden md:flex gap-1.5">
          <button onClick={() => scroll(-1)} aria-label="Scroll left"
            className="w-8 h-8 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll right"
            className="w-8 h-8 rounded-full border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={rail} className="mt-4 flex gap-4 overflow-x-auto px-5 md:px-10 pb-3 scrollbar-none">
        {games.map((g) => (
          <GameCard key={g.id} game={g} onPlay={onPlay}
            best={stats[g.id]?.best} plays={stats[g.id]?.plays || 0}
            rating={ratings?.[g.id]} />
        ))}
      </div>
    </section>
  );
}