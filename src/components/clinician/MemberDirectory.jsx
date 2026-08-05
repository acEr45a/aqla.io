import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Users, ShieldAlert, Activity, Send, Search, RefreshCw } from "lucide-react";

const PLAN_FAMILIES = ["SPARK", "FLOW", "DRIVE", "LEARN", "RESET", "DIGITAL"];

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "protocol", label: "Protocol" },
  { value: "safety", label: "Safety" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "follow_up", label: "Follow-up" },
];

export default function MemberDirectory() {
  const [members, setMembers] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState({ title: "", message: "", category: "general" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [planDraft, setPlanDraft] = useState({ family: "", reason: "" });
  const [changingPlan, setChangingPlan] = useState(false);
  const [planMsg, setPlanMsg] = useState("");

  const load = async () => {
    try {
      const res = await base44.functions.invoke("getMemberData", {});
      setMembers(res.data?.members || []);
    } catch {
      setMembers([]);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = (members || []).filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q) || (m.protocol?.name || "").toLowerCase().includes(q);
  });

  const open = (m) => {
    setSelected(m);
    setDraft({ title: "", message: "", category: "general" });
    setPlanDraft({ family: m.protocol?.family || "", reason: "" });
    setPlanMsg("");
    setError("");
  };
  const close = () => setSelected(null);

  const changePlan = async () => {
    if (!planDraft.family) {
      setPlanMsg("Pick a plan family first.");
      return;
    }
    if (planDraft.family === selected.protocol?.family) {
      setPlanMsg("That's already their active plan.");
      return;
    }
    setChangingPlan(true);
    setPlanMsg("");
    try {
      const res = await base44.functions.invoke("changeMemberPlan", {
        user_id: selected.id,
        family: planDraft.family,
        reason: planDraft.reason,
      });
      if (res.data?.ok) {
        setPlanMsg("Plan updated — member notified by pop-up and email.");
        load();
      } else {
        setPlanMsg(res.data?.error || "Could not change plan.");
      }
    } catch {
      setPlanMsg("Could not change plan.");
    }
    setChangingPlan(false);
  };

  const send = async () => {
    if (!draft.message.trim()) {
      setError("Please write a message before sending.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await base44.functions.invoke("pushMemberRecommendation", {
        user_id: selected.id,
        title: draft.title,
        message: draft.message,
        category: draft.category,
      });
      setSending(false);
      close();
    } catch {
      setSending(false);
      setError("Could not send. Please try again.");
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground tracking-widest uppercase">
          Member directory · <span className="text-foreground tabular-nums">{members === null ? "—" : members.length}</span>
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members…"
          className="w-full rounded-full border border-border bg-secondary/40 pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {members === null ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-secondary/40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="aqla-panel rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No members found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => open(m)}
              className="text-left aqla-panel rounded-2xl p-4 hover:border-primary/30 transition-colors"
            >
              <p className="text-sm font-medium text-foreground">{m.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {m.protocol ? `${m.protocol.family} · ${m.protocol.name}` : "No active protocol"}
              </p>
              {m.safety_screening?.flags?.length > 0 && (
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#E8A28F]">
                  <ShieldAlert className="w-3 h-3" /> {m.safety_screening.flags.length} safety flag(s)
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selected.name}</DialogTitle>
                <DialogDescription>
                  Review their plan and safety screening, then push a recommendation to their dashboard and email.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 max-h-[55vh] overflow-y-auto scrollbar-none pr-1">
                <div className="aqla-panel rounded-2xl p-4">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Activity className="w-3 h-3" /> Active protocol
                  </p>
                  {selected.protocol ? (
                    <div className="mt-2">
                      <p className="text-sm text-foreground">{selected.protocol.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selected.protocol.family} · {selected.protocol.objective}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No active protocol.</p>
                  )}
                </div>

                <div className="aqla-panel rounded-2xl p-4">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3" /> Safety screening
                  </p>
                  {selected.safety_screening ? (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs text-foreground">
                        Eligibility:{" "}
                        <span className="text-muted-foreground">{selected.safety_screening.eligibility_status}</span>
                      </p>
                      {selected.safety_screening.flags?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selected.safety_screening.flags.map((f, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-[#E8756B]/15 text-[#E8A28F] text-[11px]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No safety flags.</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No screening on file.</p>
                  )}
                </div>

                <div className="aqla-panel rounded-2xl p-4 space-y-2.5">
                  <p className="text-[11px] uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Send className="w-3 h-3" /> Push recommendation
                  </p>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Title (optional)"
                    className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none"
                  />
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <Textarea
                    value={draft.message}
                    onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                    placeholder="Your recommendation…"
                    rows={3}
                    className="bg-secondary/40 border-border text-sm"
                  />
                  {error && <p className="text-xs text-[#E8A28F]">{error}</p>}
                </div>

                <div className="aqla-panel rounded-2xl p-4 space-y-2.5">
                  <p className="text-[11px] uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" /> Change plan
                  </p>
                  <select
                    value={planDraft.family}
                    onChange={(e) => setPlanDraft({ ...planDraft, family: e.target.value })}
                    className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none"
                  >
                    <option value="">Select a plan family…</option>
                    {PLAN_FAMILIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <input
                    value={planDraft.reason}
                    onChange={(e) => setPlanDraft({ ...planDraft, reason: e.target.value })}
                    placeholder="Reason / note for the member (optional)"
                    className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <Button onClick={changePlan} disabled={changingPlan} className="w-full">
                    {changingPlan ? "Updating…" : "Change plan & notify member"}
                  </Button>
                  {planMsg && (
                    <p className={`text-xs ${planMsg.includes("notified") || planMsg.includes("updated") ? "text-[#C9F24E]" : "text-[#E8A28F]"}`}>{planMsg}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button onClick={send} disabled={sending}>
                  {sending ? "Sending…" : "Push & email"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}