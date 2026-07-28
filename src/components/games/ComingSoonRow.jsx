import React from "react";
import ComingSoonCard from "./ComingSoonCard";
import { UPCOMING_GAMES } from "@/lib/gamesCatalog";

export default function ComingSoonRow() {
  return (
    <section className="mt-10">
      <div className="px-5 md:px-10">
        <h2 className="font-display text-lg md:text-xl font-medium tracking-tight text-foreground">Coming soon</h2>
        <p className="text-xs text-muted-foreground mt-0.5">New training modules being built and validated.</p>
      </div>
      <div className="mt-4 flex gap-4 overflow-x-auto px-5 md:px-10 pb-3 scrollbar-none">
        {UPCOMING_GAMES.map((game) => <ComingSoonCard key={game.id} game={game} />)}
      </div>
    </section>
  );
}