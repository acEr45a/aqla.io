import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { MessageSquare, Terminal, Code2 } from "lucide-react";

const modeOf = (conv) => {
  const m = conv?.metadata?.mode;
  if (m === "ops" || m === "architect") return m;
  return conv?.metadata?.name === "AQLA Architect" ? "architect" : "ops";
};

const when = (value) => (value ? new Date(value).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default function OpsAgentActivity() {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    apiClient.agents.listConversations({ agent_name: "backend_ops" })
      .then((all) => setConversations(
        (Array.isArray(all) ? all : []).sort(
          (a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0)
        )
      ))
      .catch(() => setConversations([]));
  }, []);

  const opsCount = conversations.filter((c) => modeOf(c) === "ops").length;
  const archCount = conversations.filter((c) => modeOf(c) === "architect").length;

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-foreground">Ops agent activity</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Recent sessions with the backend ops assistant.</p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1" style={{ color: "#C9F24E" }}>
            <Terminal className="h-3 w-3" /> {opsCount} ops
          </span>
          <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1" style={{ color: "#6C9EFF" }}>
            <Code2 className="h-3 w-3" /> {archCount} architect
          </span>
        </div>
      </div>

      {conversations.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">No ops sessions recorded yet. Open the console widget to start one.</p>
      ) : (
        <div className="mt-4 space-y-1.5">
          {conversations.slice(0, 8).map((conv) => {
            const mode = modeOf(conv);
            const accent = mode === "architect" ? "#6C9EFF" : "#C9F24E";
            return (
              <div key={conv.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">{conv.metadata?.name || "Untitled session"}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{when(conv.updated_date || conv.created_date)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}