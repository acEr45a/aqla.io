import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import ReviewCard from "@/components/clinician/ReviewCard";
import { Stethoscope } from "lucide-react";

export default function Clinician() {
  const [reviews, setReviews] = useState(null);

  const load = () => base44.entities.ClinicianReview.list("-created_date", 50).then(setReviews);
  useEffect(() => { load(); }, []);

  const pending = reviews?.filter((r) => r.status === "pending") || [];
  const done = reviews?.filter((r) => r.status !== "pending") || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3">
        <Stethoscope className="w-6 h-6 text-primary" strokeWidth={1.5} />
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-foreground">Clinician review</h1>
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
      <p className="mt-12 text-[11px] text-muted-foreground border-t border-border/50 pt-6">
        All decisions are logged with a timestamp. AI-proposed recommendations never bypass this review when safety flags are present.
      </p>
    </div>
  );
}