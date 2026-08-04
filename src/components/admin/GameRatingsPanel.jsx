import React from "react";
import { Star, Trophy, MessageSquare } from "lucide-react";

// Admin summary of game ratings: best-performing game, per-game averages, and a
// feed of written reviews.
export default function GameRatingsPanel({ ratings }) {
  if (!ratings || ratings.total === 0) {
    return (
      <div className="aqla-panel rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <p className="font-display text-foreground">Game ratings</p>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">No ratings submitted yet.</p>
      </div>
    );
  }

  const best = ratings.bestGame;
  const top = ratings.gameRatings.slice(0, 8);
  const maxCount = Math.max(...top.map((g) => g.count), 1);

  return (
    <div className="space-y-5">
      <div className="aqla-panel rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <p className="font-display text-foreground">Game ratings</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {ratings.total} ratings · {ratings.withFeedback} with feedback · {ratings.avg ? `avg ${ratings.avg}★` : "no average yet"}.
        </p>

        {best && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <Trophy className="h-5 w-5 text-primary" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-primary">Best-performing game</p>
              <p className="font-display text-sm text-foreground truncate">{best.game_name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-display text-lg text-foreground tabular-nums">{best.avg.toFixed(1)}★</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">{best.count} {best.count === 1 ? "rating" : "ratings"}</p>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-2.5">
          {top.map((g) => (
            <div key={g.game_id} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs text-foreground">{g.game_name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary/60" style={{ width: `${(g.count / maxCount) * 100}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-foreground tabular-nums">{g.avg.toFixed(1)}★</span>
              <span className="w-14 text-right text-[10px] text-muted-foreground tabular-nums">{g.count} rat.</span>
            </div>
          ))}
        </div>
      </div>

      <div className="aqla-panel rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <p className="font-display text-foreground">Reviews</p>
        </div>
        {ratings.recentReviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No written feedback yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {ratings.recentReviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{r.game_name}</span>
                    <span className="text-[10px] text-muted-foreground">· {r.reviewer}</span>
                  </div>
                  <span className="text-[11px] text-primary tabular-nums">{r.stars}★</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{r.feedback}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}