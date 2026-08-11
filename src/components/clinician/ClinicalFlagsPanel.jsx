import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Flag, CheckCircle2, Loader2, Send, User } from "lucide-react";
import FollowUpComposer from "@/components/clinician/FollowUpComposer";
import { notify } from "@/lib/clinicianToast";

const TABS = [
  { id: "auto", label: "User Flags", accent: "#C9F24E" },
  { id: "manual", label: "Backend Flags", accent: "#6C9EFF" },
];
const STATUSES = ["pending", "reviewed", "actioned"];

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ClinicalFlagsPanel({ onOpenMember, onAction }) {
  const [tab, setTab] = useState("auto");
  const [flags, setFlags] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [composing, setComposing] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    base44.entities.ClinicalFlag.list("-created_date", 200).then(setFlags).catch(() => setFlags([]));
  };
  useEffect(() => { load(); }, []);

  const accent = TABS.find((t) => t.id === tab).accent;
  const list = useMemo(
    () => (flags || []).filter((f) => f.flag_type === tab && (statusFilter === "all" || f.status === statusFilter)),
    [flags, tab, statusFilter]
  );

  const markReviewed = async (f) => {
    setUpdating(f.id);
    try {
      await base44.entities.ClinicalFlag.update(f.id, { status: "reviewed" });
      notify("Flag reviewed", `Marked reviewed for ${f.user_name || "member"}.`);
      load(); onAction?.();
    } catch { /* ignore */ }
    setUpdating(null);
  };

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Flag className="h-4 w-4 text-[#E8A28F]" />
        <div>
          <p className="font-display text-foreground">Clinical flags</p>
          <p className="text-xs text-muted-foreground">Zero-hallucination safety net — review flagged agent output before it reaches a member.</p>
        </div>
      </div>

      <div className="mt-4 flex rounded-full bg-secondary/60 p-1">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors"
              style={active ? { background: t.accent, color: "#0A0A0A" } : { color: "hsl(var(--muted-foreground))" }}>
              <Flag className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
        {["all", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] capitalize transition-colors ${statusFilter === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {s}
          </button>
        ))}
      </div>

      {flags === null ? (
        <div className="mt-6 flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border/60 bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
          No {tab === "auto" ? "user" : "backend"} flags to review.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((f) => (
            <div key={f.id} className="rounded-xl border border-border/60 bg-secondary/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {tab === "auto" ? (f.user_name || "Unknown member") : (f.admin_name || "Admin")} · <span className="uppercase tracking-widest">{f.source_agent}</span>
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-foreground/90">{f.message_snippet}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{f.status}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{timeAgo(f.created_date)}</span>
                <div className="flex gap-2">
                  {tab === "auto" && f.user_id && onOpenMember && (
                    <button onClick={() => onOpenMember(f.user_id, "safety")} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                      <User className="h-3 w-3" /> View member
                    </button>
                  )}
                  {tab === "auto" ? (
                    <button onClick={() => setComposing(f)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                      <Send className="h-3 w-3" /> Follow up
                    </button>
                  ) : (
                    <button onClick={() => markReviewed(f)} disabled={updating === f.id || f.status === "reviewed"}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
                      {updating === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} {f.status === "reviewed" ? "Reviewed" : "Mark reviewed"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {composing && <FollowUpComposer flag={composing} onClose={() => setComposing(null)} onSent={() => { setComposing(null); load(); }} />}
    </div>
  );
}