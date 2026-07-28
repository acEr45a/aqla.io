import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CATEGORIES, GAMES, gamesIn } from "@/lib/gamesCatalog";
import GameRow from "@/components/games/GameRow";
import GamePlayer from "@/components/games/GamePlayer";

export default function Games() {
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setRows(await base44.entities.CognitiveTest.list("-created_date", 300));
  }, []);
  useEffect(() => { load(); }, [load]);

  // per-game-type: best score + number of sessions
  const stats = useMemo(() => {
    const s = {};
    rows.forEach((r) => {
      const e = s[r.test_type] || { best: null, plays: 0 };
      e.plays += 1;
      const v = Math.round(r.normalized_score);
      e.best = e.best == null ? v : Math.max(e.best, v);
      s[r.test_type] = e;
    });
    return s;
  }, [rows]);

  const untrained = GAMES.filter((g) => !stats[g.testType]);

  if (active) {
    return <GamePlayer game={active} best={stats[active.testType]?.best}
      onClose={() => setActive(null)} onRecorded={load} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-10 md:pt-14 pb-6">
      <div className="px-5 md:px-10">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Training library</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-light tracking-tight text-foreground">
          Train the functions you want to change.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">
          Every game targets a specific mental function and is scored the same way each time — so repeated sessions
          become a trend, not a guess. Results feed your Progress timeline and Brain Map.
        </p>
      </div>

      {untrained.length > 0 && (
        <GameRow category={{ name: "Start here", blurb: "Functions you haven't measured yet." }}
          games={untrained} stats={stats} onPlay={setActive} />
      )}

      {CATEGORIES.map((c) => (
        <GameRow key={c.key} category={c} games={gamesIn(c.key)} stats={stats} onPlay={setActive} />
      ))}
    </motion.div>
  );
}