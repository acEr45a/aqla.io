import React, { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { Trash2, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

// Admin housekeeping: scan for stale/unused protocols across all members and
// remove them. A member's current active plan is never listed or removable.
export default function ProtocolCleanupPanel() {
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [picked, setPicked] = useState([]);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const runScan = async () => {
    setLoading(true); setError(""); setDone(null);
    try {
      const res = await apiClient.functions.invoke("cleanupProtocols", { mode: "scan" });
      if (res.data?.error) throw new Error(res.data.error);
      setScan(res.data);
      setPicked([]);
    } catch (e) {
      setError(e.message || "Scan failed.");
    }
    setLoading(false);
  };

  const remove = async (payload, count) => {
    if (deleting) return;
    if (!window.confirm(`Permanently delete ${count} protocol record(s)? Active plans are not affected.`)) return;
    setDeleting(true); setError("");
    try {
      const res = await apiClient.functions.invoke("cleanupProtocols", { mode: "delete", ...payload });
      if (res.data?.error) throw new Error(res.data.error);
      setDone(res.data.deleted_count);
      await runScan();
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
    setDeleting(false);
  };

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-primary" />
          <div>
            <p className="font-display text-foreground">Protocol cleanup</p>
            <p className="text-xs text-muted-foreground">
              Finds old, completed, and superseded plans across all members. Current active plans are never touched.
            </p>
          </div>
        </div>
        <button onClick={runScan} disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Scan
        </button>
      </div>

      {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
      {done != null && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-[#7BC950]">
          <CheckCircle2 className="h-3.5 w-3.5" /> Removed {done} protocol record(s).
        </p>
      )}

      {scan && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: scan.total_protocols },
              { label: "In use", value: scan.kept },
              { label: "Removable", value: scan.stale_count },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-display text-lg text-foreground tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          {scan.stale_count === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nothing to clean up — no stale protocols found.</p>
          ) : (
            <>
              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto scrollbar-none">
                {scan.stale.map((p) => (
                  <label key={p.id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2">
                    <input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)}
                      className="mt-1 h-3.5 w-3.5 shrink-0 accent-current" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">
                        {p.user_name} · {p.family} · {p.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{p.reason}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {p.start_date || "—"} → {p.review_date || "—"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => remove({ protocol_ids: picked }, picked.length)}
                  disabled={deleting || picked.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs text-foreground disabled:opacity-50">
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete selected ({picked.length})
                </button>
                <button onClick={() => remove({ all: true }, scan.stale_count)} disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground disabled:opacity-50">
                  Delete all removable ({scan.stale_count})
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}