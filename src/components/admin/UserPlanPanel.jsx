import React from "react";
import { PROTOCOL_FAMILIES } from "@/lib/protocols";

export default function UserPlanPanel({ users }) {
  const byPlan = PROTOCOL_FAMILIES.map((f) => ({
    ...f,
    users: users.filter((u) => u.plan === f.key),
  }));
  const noPlan = users.filter((u) => !u.plan);

  return (
    <section className="aqla-panel rounded-2xl p-5">
      <p className="font-display text-foreground">Plan distribution</p>
      <p className="mt-1 text-xs text-muted-foreground">Which users are on which active protocol</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {byPlan.map((f) => (
          <div key={f.key} className="rounded-xl border border-border/60 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{f.name}</span>
            </div>
            <p className="mt-2 font-display text-2xl text-foreground tabular-nums">{f.users.length}</p>
          </div>
        ))}
        <div className="rounded-xl border border-border/60 p-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">None</span>
          </div>
          <p className="mt-2 font-display text-2xl text-foreground tabular-nums">{noPlan.length}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {byPlan.filter((f) => f.users.length).map((f) => (
          <div key={f.key}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
              <p className="text-xs uppercase tracking-widest text-foreground">{f.name}</p>
              <span className="text-xs text-muted-foreground">{f.users.length} user{f.users.length === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {f.users.map((u) => (
                <div key={u.id} className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-2">
                  <p className="truncate text-sm text-foreground">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {noPlan.length > 0 && (
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              <p className="text-xs uppercase tracking-widest text-foreground">No active plan</p>
              <span className="text-xs text-muted-foreground">{noPlan.length} user{noPlan.length === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {noPlan.map((u) => (
                <div key={u.id} className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-2">
                  <p className="truncate text-sm text-foreground">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {users.length === 0 && <p className="text-sm text-muted-foreground">No users yet.</p>}
      </div>
    </section>
  );
}