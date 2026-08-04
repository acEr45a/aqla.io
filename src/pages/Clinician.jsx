import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import ReviewCard from "@/components/clinician/ReviewCard";
import PlanDecisionCard from "@/components/clinician/PlanDecisionCard";
import SendToAdminCard from "@/components/clinician/SendToAdminCard";
import { Stethoscope } from "lucide-react";

export default function Clinician() {
  const [reviews, setReviews] = useState(null);
  const [plans, setPlans] = useState(null);
  const [allowed, setAllowed] = useState(null);

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

  const pending = reviews?.filter((r) => r.status === "pending") || [];
  const done = reviews?.filter((r) => r.status !== "pending") || [];

  if (allowed === null) {
    return <div className="max-w-4xl mx-auto px-6 py-10 text-sm text-muted-foreground">Loading clinician dashboard…</div>;
  }
  if (!allowed) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
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
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3">
        <Stethoscope className="w-6 h-6 text-primary" strokeWidth={1.5} />
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-foreground">Clinician dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Supplement recommendations awaiting professional decision</p>
        </div>
      </div>

      {reviews === null ? (
        <div className="mt-10 space-y-4">{[1, 2].map((i) => <div key={i} className="h-40 animate-pulse bg-secondary/40 rounded-2xl" />)}</div>
      ) : (
        <>
          <section className="mt-10">
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-4">
              Awaiting review · <span className="text-foreground tabular-nums">{pending.length}</span>
            </p>
            {pending.length === 0 ? (
              <div className="aqla-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">
                No recommendations are currently awaiting review.
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((r) => <ReviewCard key={r.id} review={r} onUpdate={load} />)}
              </div>
            )}
          </section>

          {done.length > 0 && (
            <section className="mt-12">
              <p className="text-xs text-muted-foreground tracking-widest uppercase mb-4">Decision history</p>
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