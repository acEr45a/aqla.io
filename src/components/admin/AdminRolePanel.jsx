import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserRound } from "lucide-react";

export default function AdminRolePanel() {
  const [state, setState] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async (payload = {}) => {
    const response = await base44.functions.invoke("manageUserRoles", payload);
    setState(response.data);
  };

  useEffect(() => { load(); }, []);

  const setRole = async (userId, role) => {
    setBusyId(userId);
    setError("");
    try {
      await load({ action: "set_role", user_id: userId, role });
    } catch (e) {
      setError(e?.response?.data?.error || "Could not update this user's role.");
    }
    setBusyId(null);
  };

  if (!state) return <div className="aqla-panel rounded-2xl p-5 text-sm text-muted-foreground">Loading roles…</div>;

  return (
    <section className="aqla-panel overflow-hidden rounded-2xl">
      <div className="p-5">
        <p className="font-display text-foreground">Access control</p>
        <p className="mt-1 text-xs text-muted-foreground">Promote a member to admin or return them to a standard account.</p>
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      </div>
      <div className="divide-y divide-border/40 border-t border-border/60">
        {state.users.map((user) => {
          const isAdmin = user.role === "admin";
          const isSelf = user.id === state.currentUserId;
          return (
            <div key={user.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className={`rounded-lg p-2 ${isAdmin ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{user.name}{isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <span className={`text-xs uppercase tracking-widest ${isAdmin ? "text-primary" : "text-muted-foreground"}`}>{user.role}</span>
              <Button size="sm" variant={isAdmin ? "outline" : "default"} disabled={isSelf || busyId === user.id}
                onClick={() => setRole(user.id, isAdmin ? "user" : "admin")}>
                {busyId === user.id ? "Saving…" : isAdmin ? "Revoke admin" : "Make admin"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}