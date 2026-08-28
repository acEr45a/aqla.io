import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/apiClient";
import {
  MessageSquareWarning, Search, Loader2, Sparkles, ChevronDown, ChevronRight,
  RefreshCw, CircleDot, CheckCircle2, Wrench, Copy, Check
} from "lucide-react";

const CATEGORIES = ["Bug", "Account", "Data issue", "Protocol question", "Safety concern", "Other"];
const STATUSES = [
  { value: "open", label: "Open", color: "#E8A28F" },
  { value: "investigating", label: "Investigating", color: "#E8C63A" },
  { value: "resolved", label: "Resolved", color: "#7BC950" },
];

const STATUS_DOT = { open: "#E8A28F", investigating: "#E8C63A", resolved: "#7BC950" };

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function UserComplaintsPanel() {
  const [complaints, setComplaints] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiMatches, setAiMatches] = useState(null); // {id: reason}
  const [aiError, setAiError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await apiClient.entities.UserComplaint.list("-created_date", 500);
      setComplaints(list || []);
    } catch {
      setComplaints([]);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const localFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (complaints || []).filter((c) => {
      if (category && c.category !== category) return false;
      if (status && c.status !== status) return false;
      if (!q) return true;
      return [c.subject, c.detail, c.category, c.user_name, c.user_email]
        .filter(Boolean).some((s) => s.toLowerCase().includes(q));
    });
  }, [complaints, query, category, status]);

  const ordered = useMemo(() => {
    if (!aiMode || !aiMatches) return localFiltered;
    // AI matches first (by rank), then the rest
    const matched = [];
    const rest = [];
    for (const c of localFiltered) {
      if (aiMatches[c.id]) matched.push(c);
      else rest.push(c);
    }
    return [...matched, ...rest];
  }, [localFiltered, aiMode, aiMatches]);

  const runAiSearch = async () => {
    if (!query.trim() || aiSearching) return;
    setAiSearching(true); setAiError(""); setAiMatches(null);
    try {
      const res = await apiClient.functions.invoke("searchUserComplaints", { query });
      if (res.data?.error) { setAiError(res.data.error); }
      else {
        const map = {};
        (res.data?.matches || []).forEach((m) => { map[m.id] = m.reason; });
        setAiMatches(map);
      }
    } catch (e) { setAiError(e.message); }
    setAiSearching(false);
  };

  const setStatus2 = async (c, next) => {
    setUpdatingId(c.id);
    try {
      await apiClient.entities.UserComplaint.update(c.id, { status: next });
      await load();
    } catch { }
    setUpdatingId(null);
  };

  const counts = useMemo(() => {
    const all = complaints || [];
    return {
      open: all.filter((c) => c.status === "open").length,
      investigating: all.filter((c) => c.status === "investigating").length,
      resolved: all.filter((c) => c.status === "resolved").length,
      total: all.length,
    };
  }, [complaints]);

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <div>
            <p className="font-display text-foreground">User complaints</p>
            <p className="text-xs text-muted-foreground">
              {counts.total} total · {counts.open} open · {counts.investigating} investigating · {counts.resolved} resolved
            </p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      {/* Search + AI */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && aiMode) runAiSearch(); }}
              placeholder={aiMode ? "Describe what you're looking for…" : "Search subject, detail, user…"}
              className="w-full rounded-full border border-border bg-secondary/40 pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => { setAiMode((v) => !v); setAiMatches(null); setAiError(""); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2.5 text-xs transition-colors ${aiMode ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            title="AI semantic search finds complaints with similar meaning"
          >
            <Sparkles className="h-3.5 w-3.5" /> AI
          </button>
          {aiMode && (
            <button
              onClick={runAiSearch}
              disabled={aiSearching || !query.trim()}
              className="shrink-0 rounded-full bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {aiSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Find similar"}
            </button>
          )}
        </div>
        {aiError && <p className="text-xs text-destructive">{aiError}</p>}
        {aiMode && aiMatches && (
          <p className="text-[11px] text-muted-foreground">
            {Object.keys(aiMatches).length} semantic match{Object.keys(aiMatches).length === 1 ? "" : "es"} · ranked by meaning, not keywords.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-foreground outline-none">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-foreground outline-none">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(category || status || query) && (
          <button onClick={() => { setCategory(""); setStatus(""); setQuery(""); setAiMatches(null); }}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>

      {/* List */}
      <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto scrollbar-none">
        {complaints === null ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse bg-secondary/40 rounded-xl" />)}</div>
        ) : ordered.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
            {complaints.length === 0 ? "No complaints yet." : "No complaints match your filters."}
          </div>
        ) : ordered.map((c) => {
          const isOpen = expanded === c.id;
          const aiReason = aiMode && aiMatches ? aiMatches[c.id] : null;
          return (
            <div key={c.id} className={`rounded-xl border bg-secondary/30 ${aiReason ? "border-primary/40" : "border-border/60"}`}>
              <button onClick={() => setExpanded(isOpen ? null : c.id)}
                className="flex w-full items-start gap-2.5 px-3 py-3 text-left">
                <span className="mt-1 shrink-0"><CircleDot className="h-3 w-3" style={{ color: STATUS_DOT[c.status] || "#a89c84" }} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{c.subject || c.category}</p>
                    <span className="shrink-0 rounded-full bg-border/40 px-2 py-0.5 text-[10px] text-muted-foreground">{c.category}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.user_name || c.user_email || "Unknown user"} · {timeAgo(c.created_date)}
                  </p>
                  {aiReason && <p className="mt-1 text-[11px] text-primary/90">AI: {aiReason}</p>}
                </div>
                {isOpen ? <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="border-t border-border/50 px-3 py-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{c.detail}</p>
                  {c.admin_note && <p className="mt-2 text-xs text-muted-foreground">Admin note: {c.admin_note}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Set status:</span>
                    {STATUSES.map((s) => (
                      <button key={s.value} disabled={updatingId === c.id}
                        onClick={() => setStatus2(c, s.value)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${c.status === s.value ? "border-transparent text-black" : "border-border text-muted-foreground hover:text-foreground"}`}
                        style={c.status === s.value ? { background: s.color } : {}}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}