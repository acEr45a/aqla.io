import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { ShieldCheck, Crown, Loader2, UserMinus, UserPlus } from "lucide-react";
import PromoteModal from "./PromoteModal";

export default function AdminRoster() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await apiClient.functions.invoke("superAdminOps", { action: "listAdmins" });
    setAdmins(res.data?.admins || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const demote = async (id) => {
    await apiClient.functions.invoke("superAdminOps", { action: "demote", target_user_id: id });
    load();
  };

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <p className="font-display text-foreground">Admin roster</p>
      </div>
      {loading ? (
        <div className="flex h-24 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{a.full_name || a.email}</p>
                <p className="text-xs text-muted-foreground truncate">{a.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.isSuper && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary"><Crown className="h-3 w-3" />Super</span>}
                {a.isSuper ? (
                  <button onClick={() => demote(a.id)} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground"><UserMinus className="h-3 w-3" />Revoke</button>
                ) : (
                  <button onClick={() => setTarget(a)} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:border-primary/50 hover:text-foreground"><UserPlus className="h-3 w-3" />Promote</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <PromoteModal target={target} onClose={() => setTarget(null)} onDone={load} />
    </div>
  );
}