import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import ReviewCard from "@/components/clinician/ReviewCard";
import PlanDecisionCard from "@/components/clinician/PlanDecisionCard";
import SendToAdminCard from "@/components/clinician/SendToAdminCard";
import MemberDirectory from "@/components/clinician/MemberDirectory";
import { Stethoscope, Search, ShieldAlert, ArrowUpDown, Clock, CheckCircle2 } from "lucide-react";

const STAT = ({ icon: Icon, label, value, accent }) => (
  <div className="aqla-panel rounded-2xl p-4 flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: `${accent}1a` }}>
      <Icon className="h-4 w-4" style={{ color: accent }} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-lg text-foreground tabular-nums">{value}</p>
    </div>
  </div>
);

export default function Clinician() {
  const [reviews, setReviews] = useState(null);
  const [plans, setPlans] = useState(null);
  const [allowed, setAllowed] = useState(null);
  const [query, setQuery] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);

  const load = () => {
    base44.entities.ClinicianReview.list("-created_date", 50).then(setReviews);
    base44.entities.PlanReview.list("-completed_date", 100).then(setPlans).catch(() => setPlans([]));
  };
  useEffect(() => {
    base44.auth.me()
      .then((user) => {
        const ok = user && (user.role === "clinician" || user.role === "admin");
        setAllowed(ok);
        if (ok) load();
      })
      .catch(() => setAllowed(false));
  }, []);

  const matches = (r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [r.user_name, r.goal, r.recommendation, r.evidence_level, r.ai_reasoning]
      .filter(Boolean).some((s) => s.toLowerCase().includes(q));
  };

  const sortByUrgency = (list) =>
    urgentOnly ? [...list].sort((a, b) => (b.safety_flags?.length || 0) - (a.safety_flags?.length || 0)) : list;

  const pending = useMemo(
    () => sortByUrgency((reviews?.filter((r) => r.status === "pending") || []).filter(matches)),
    [reviews, query, urgentOnly]
  );
  const done = useMemo(
    () => sortByUrgency((reviews?.filter((r) => r.status !== "pending") || []).filter(matches)),
    [reviews, query, urgentOnly]
  );

  const safetyCount = reviews?.filter((r) => r.safety_flags?.length > 0).length || 0;
  const pendingCount = reviews?.filter((r) => r.status === "pending").length || 0;
  const decidedCount = reviews ? reviews.length - pendingCount : 0;

  if (allowed === null) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-sm text-muted-foreground">Loading clinician dashboard…</div>;
  }
  if (!allowed) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-6 h-6 text-primary" strokeWidth={1.5} />
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-foreground">Clinician dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Professional review workspace</p>
          </div>
        </div>
        <div className="aqla-panel mt-8 rounded-2xl p-10 text-center">
          <Stethoscope className="mx-auto h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-foreground">Clinician access required</p>
          <p className="mt-2 text-xs text-muted-foreground">This workspace is restricted to clinicians and administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3">
        <Stethoscope className="w-6 h-6 text-primary" strokeWidth={1.5} />
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-foreground">Clinician dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Supplement recommendations awaiting professional decision</p>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <STAT icon={Clock} label="Awaiting" value={pendingCount} accent="#F2C04E" />
        <STAT icon={ShieldAlert} label="Safety flags" value={safetyCount} accent="#E8756B" />
        <STAT icon={CheckCircle2} label="Decided" value={decidedCount} accent="#C9F24E" />
        <STAT icon={Stethoscope} label="Plan decisions" value={plans === null ? "—" : plans.length} accent="#7B94FF" />
      </div>

      <section className="mt-10">
        <MemberDirectory />
      </section>

      {/* Search + urgency filter */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members, goals, recommendations…"
            className="w-full rounded-full border border-border bg-secondary/40 pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
        </div>
        <button onClick={() => setUrgentOnly((v) => !v)}
          className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs transition-colors ${urgentOnly ? "bg-[#E8756B]/15 border-[#E8756B]/40 text-[#E8A28F]" : "border-border text-muted-foreground hover:text-foreground"}`}>
          <ArrowUpDown className="h-3.5 w-3.5" /> Urgency first
        </button>
      </div>

      {reviews === null ? (
        <div className="mt-8 space-y-4">{[1, 2].map((i) => <div key={i} className="h-40 animate-pulse bg-secondary/40 rounded-2xl" />)}</div>
      ) : (
        <>
          <section className="mt-8">
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-4">
              Awaiting review · <span className="text-foreground tabular-nums">{pending.length}</span>
            </p>
            {pending.length === 0 ? (
              <div className="aqla-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">
                {query || urgentOnly ? "No reviews match your filters." : "No recommendations are currently awaiting review."}
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((r) => <ReviewCard key={r.id} review={r} onUpdate={load} />)}
              </div>
            )}
          </section>

          {done.length > 0 && (
            <section className="mt-12">
              <p className="text-xs text-muted-foreground tracking-widest uppercase mb-4">
                Decision history · <span className="tabular-nums text-foreground">{done.length}</span>
              </p>
              <div className="space-y-4">
                {done.map((r) => <ReviewCard key={r.id} review={r} onUpdate={load} />)}
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-12">
        <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Escalate to admin</p>
        <SendToAdminCard />
      </section>

      {plans !== null && (
        <section className="mt-12">
          <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
            Member plan decisions · <span className="tabular-nums text-foreground">{plans.length}</span>
          </p>
          {plans.length === 0 ? (
            <div className="aqla-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">
              No member plan decisions have been recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((p) => <PlanDecisionCard key={p.id} review={p} />)}
            </div>
          )}
        </section>
      )}

      <p className="mt-12 text-[11px] text-muted-foreground border-t border-border/50 pt-6">
        All decisions are logged with a timestamp. AI-proposed recommendations never bypass this review when safety flags are present.
      </p>
    </div>
  );
}