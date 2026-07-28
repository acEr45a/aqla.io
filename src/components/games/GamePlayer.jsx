import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

// Plays a game, records the session as a cognitive test, then shows the score.
export default function GamePlayer({ game, best, onClose, onRecorded }) {
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const C = game.Component;

  const complete = async ({ raw, score }) => {
    setSaving(true);
    await base44.entities.CognitiveTest.create({
      test_type: game.testType,
      raw_results: { ...raw, game_id: game.id },
      normalized_score: score,
      completed_date: new Date().toISOString(),
      valid: true,
    });
    setSaving(false);
    setResult(Math.round(score));
    onRecorded && onRecorded();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">{game.trains}</p>
          <p className="font-display text-sm text-foreground tracking-tight">{game.name}</p>
        </div>
        <button onClick={onClose} aria-label="Exit game" className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        {result == null ? (
          <div className="w-full h-full max-h-[70vh] flex items-center justify-center">
            {saving ? <p className="text-sm text-muted-foreground">Recording session…</p> : <C onComplete={complete} />}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className="aqla-panel rounded-3xl p-8 text-center max-w-sm w-full">
            <p className="text-xs uppercase tracking-widest text-primary">Session recorded</p>
            <p className="mt-5 font-display text-6xl font-light text-foreground tabular-nums">{result}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {best != null ? (result > best ? `New personal best — previous ${best}` : `Personal best ${best}`) : "First session — this is your baseline"}
            </p>
            <div className="mt-7 flex flex-col gap-2">
              <button onClick={() => setResult(null)}
                className="px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium">Play again</button>
              <button onClick={onClose}
                className="px-6 py-3 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to library
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}