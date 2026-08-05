import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, RotateCcw, Filter, ShieldAlert } from "lucide-react";

export default function MemberDataPanel() {
  const [data, setData] = useState(null);
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const load = async (uid = userId) => {
    setError("");
    const res = await base44.functions.invoke("getMemberData", { user_id: uid || null });
    setData(res.data);
  };

  useEffect(() => { load(""); }, []);

  const invalidate = async (id, userName, date) => {
    if (!window.confirm(`Mark ${userName}'s check-in for ${date} as invalid? They will be able to submit a fresh one. The original record is kept.`)) return;
    setBusy(id);
    try {
      await base44.functions.invoke("invalidateCheckIn", { check_in_id: id });
      await load();
    } catch (e) {
      setError(e?.message || "Could not invalidate check-in.");
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <p className="text-sm text-muted-foreground">Loading member data…</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <ShieldAlert className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="aqla-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary" />
          <p className="text-sm text-foreground">Filter by member</p>
        </div>
        <select value={userId} onChange={(e) => { setUserId(e.target.value); load(e.target.value); }}
          className="w-full sm:w-72 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground">
          <option value="">All members</option>
          {data.users.map((u) => (
            <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
          ))}
        </select>
      </div>

      <div className="aqla-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-primary" />
          <p className="text-sm text-foreground">Daily check-ins {userId ? "(filtered)" : ""}</p>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">{data.checkIns.length} records</span>
        </div>
        {data.checkIns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No check-ins found.</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Member</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Clarity</th>
                  <th className="py-2 pr-3 font-medium">Energy</th>
                  <th className="py-2 pr-3 font-medium">Stress</th>
                  <th className="py-2 pr-3 font-medium">Sleep</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.checkIns.map((c) => (
                  <tr key={c.id} className="border-t border-border/50">
                    <td className="py-3 pr-4 text-foreground">{c.user}</td>
                    <td className="py-3 pr-4 text-muted-foreground tabular-nums">{c.date}</td>
                    <td className="py-3 pr-3 tabular-nums text-foreground">{c.clarity ?? "—"}</td>
                    <td className="py-3 pr-3 tabular-nums text-foreground">{c.energy ?? "—"}</td>
                    <td className="py-3 pr-3 tabular-nums text-foreground">{c.stress ?? "—"}</td>
                    <td className="py-3 pr-3 tabular-nums text-foreground">{c.sleep_quality ?? "—"}</td>
                    <td className="py-3 pr-4">
                      {c.valid
                        ? <span className="text-xs text-primary">Valid</span>
                        : <span className="text-xs text-destructive">Invalidated</span>}
                    </td>
                    <td className="py-3 text-right">
                      {c.valid && (
                        <button onClick={() => invalidate(c.id, c.user, c.date)} disabled={busy === c.id}
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50">
                          <RotateCcw className="w-3.5 h-3.5" /> {busy === c.id ? "…" : "Force retake"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="aqla-panel rounded-2xl p-5">
        <p className="text-sm text-foreground mb-4">Protocols {userId ? "(filtered)" : ""}</p>
        {data.protocols.length === 0 ? (
          <p className="text-sm text-muted-foreground">No protocols found.</p>
        ) : (
          <div className="space-y-3">
            {data.protocols.map((p) => (
              <div key={p.id} className="flex items-start gap-4 border-t border-border/50 pt-3 first:border-0 first:pt-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.user} · {p.family}</p>
                </div>
                <span className={`text-xs ${p.status === "active" ? "text-primary" : "text-muted-foreground"}`}>{p.status}</span>
                <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">{p.start_date || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}