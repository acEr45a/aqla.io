import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { ScrollText, Loader2 } from "lucide-react";

export default function SuperAdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const res = await apiClient.functions.invoke("superAdminOps", { action: "logs" });
    setLogs(res.data?.logs || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="h-4 w-4 text-primary" />
        <p className="font-display text-foreground">Super Admin audit log</p>
      </div>
      {loading ? <div className="flex h-20 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div> : (
        <div className="space-y-2 max-h-72 overflow-auto scrollbar-none">
          {logs.length === 0 ? <p className="text-xs text-muted-foreground">No actions logged yet.</p> : logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-xs">
              <span className="text-foreground font-mono">{l.action}{l.target_user_id ? ` · ${l.target_user_id.slice(0, 8)}` : ""}</span>
              <span className="text-muted-foreground tabular-nums">{l.timestamp ? new Date(l.timestamp).toLocaleString() : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}