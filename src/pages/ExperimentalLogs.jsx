import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ExperimentLogForm from "@/components/experimentlogs/ExperimentLogForm";
import ExperimentLogList from "@/components/experimentlogs/ExperimentLogList";

export default function ExperimentalLogs() {
  const [logs, setLogs] = useState(null);

  const load = useCallback(async () => {
    setLogs(await base44.entities.ExperimentLog.list("-date", 100));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-5 md:px-10 pt-10 md:pt-14 pb-6">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Experimental logs</p>
      <h1 className="mt-2 font-display text-3xl md:text-4xl font-light tracking-tight text-foreground">
        Log the variables you're testing.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">
        Record single changes — caffeine timing, morning light, sleep timing — alongside how the day felt.
        Paired with your daily check-ins, patterns become visible over weeks, not days.
      </p>

      <div className="mt-8">
        <ExperimentLogForm onSaved={load} />
      </div>

      {logs === null
        ? <p className="mt-8 text-sm text-muted-foreground">Loading your entries…</p>
        : <ExperimentLogList logs={logs} onChanged={load} />}
    </motion.div>
  );
}