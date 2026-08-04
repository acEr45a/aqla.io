import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import HealthGauge from "@/components/admin/HealthGauge";
import { Activity, CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw } from "lucide-react";

const STATUS_ICON = {
  pass: <CheckCircle2 className="h-4 w-4 text-[#7BC950]" />,
  warn: <AlertTriangle className="h-4 w-4 text-[#E8C63A]" />,
  fail: <XCircle className="h-4 w-4 text-[#E5533C]" />,
};

export default function AppHealthPanel() {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const runTest = async () => {
    setRunning(true); setError("");
    try {
      const res = await base44.functions.invoke("runAppDiagnostics", {});
      if (res.data?.checks) setResult(res.data);
      else setError(res.data?.error || "Test could not complete.");
    } catch (e) {
      setError(e.message);
    }
    setRunning(false);
  };

  useEffect(() => { runTest(); }, []);

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <div>
            <p className="font-display text-foreground">App health</p>
            <p className="text-xs text-muted-foreground">Live diagnostics across data, backend, and delivery.</p>
          </div>
        </div>
        <button onClick={runTest} disabled={running}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Run full app test
        </button>
      </div>

      {error && <p className="mt-4 text-xs text-destructive">{error}</p>}

      {!result && running && (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Running diagnostics…</div>
      )}

      {result && (
        <div className="mt-4 grid gap-6 lg:grid-cols-[240px_1fr] lg:items-center">
          <HealthGauge score={result.score} />
          <div className="space-y-2">
            {result.checks.map((check) => (
              <div key={check.name} className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2">
                <span className="mt-0.5 shrink-0">{STATUS_ICON[check.status]}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{check.name}</p>
                  <p className="text-[11px] text-muted-foreground">{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}