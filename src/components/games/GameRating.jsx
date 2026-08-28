import React, { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Star } from "lucide-react";

// Lets a player rate the game they just finished, with optional written feedback.
export default function GameRating({ game }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | saved
  const [error, setError] = useState("");

  const submit = async () => {
    if (stars < 1) return;
    setStatus("saving");
    setError("");
    try {
      await apiClient.entities.GameRating.create({
        game_id: game.id,
        game_name: game.name,
        stars,
        feedback: feedback.trim() || undefined,
      });
      setStatus("saved");
    } catch (e) {
      setError(e.message || "Could not save rating");
      setStatus("idle");
    }
  };

  if (status === "saved") {
    return (
      <div className="mt-6 rounded-2xl border border-border/70 bg-secondary/30 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">Thanks for rating {game.name}.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-border/70 bg-secondary/30 px-4 py-4 text-left">
      <p className="text-xs text-muted-foreground">Rate this game</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            onClick={() => setStars(n)}
            className="p-0.5">
            <Star className={`w-5 h-5 transition-colors ${
              (hover || stars) >= n ? "fill-primary text-primary" : "text-muted-foreground/50"}`}
              strokeWidth={1.5} />
          </button>
        ))}
        {stars > 0 && <span className="ml-2 text-xs text-foreground tabular-nums">{stars}.0</span>}
      </div>
      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
        placeholder="Optional feedback — what worked, what didn't…"
        rows={2}
        className="mt-3 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring" />
      {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={submit} disabled={stars < 1 || status === "saving"}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40">
          {status === "saving" ? "Saving…" : "Submit rating"}
        </button>
      </div>
    </div>
  );
}