import React from "react";

export default function AdminUserTable({ users }) {
  return (
    <section className="aqla-panel overflow-hidden rounded-2xl">
      <div className="p-5"><p className="font-display text-foreground">Recent users</p><p className="mt-1 text-xs text-muted-foreground">Registration and engagement overview</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-y border-border/60 text-[11px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-5 py-3 font-medium">User</th><th className="px-5 py-3 font-medium">Joined</th><th className="px-5 py-3 font-medium">Assessment</th><th className="px-5 py-3 font-medium">Check-ins</th><th className="px-5 py-3 font-medium">Protocol</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-border/40 last:border-0"><td className="px-5 py-4"><p className="text-foreground">{user.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p></td><td className="px-5 py-4 text-muted-foreground">{new Date(user.joined).toLocaleDateString()}</td><td className="px-5 py-4"><span className={user.assessmentComplete ? "text-primary" : "text-muted-foreground"}>{user.assessmentComplete ? "Complete" : "Not started"}</span></td><td className="px-5 py-4 text-foreground tabular-nums">{user.checkIns}</td><td className="px-5 py-4 text-foreground">{user.protocol}</td></tr>)}</tbody></table></div>
    </section>
  );
}