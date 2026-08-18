import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { base44 } from "@/api/base44Client";
import ProtocolPlanCard from "@/components/protocols/ProtocolPlanCard";
import DailyPlanPdfButton from "@/components/today/DailyPlanPdfButton";
import EvidenceActionCard from "@/components/evidence/EvidenceActionCard";
import { LIFESTYLE_EVIDENCE } from "@/lib/lifestyleEvidence";
import { Shield, ArrowRight } from "lucide-react";

export default function ProtocolPage() {
  const [protocols, setProtocols] = useState(undefined);
  const [user, setUser] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    base44.entities.Protocol.list("-created_date").then(setProtocols);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (profile) setUser({ id: session.user.id, email: session.user.email, ...profile });
    }).catch(() => {});
    base44.entities.DailyCheckIn.list("-date", 8).then(setCheckIns);
    base44.entities.BrainDomain.list("-updated_date").then(setDomains);
  }, []);

  const protocol = protocols?.find((item) => item.status === "active") || null;
  const otherPlans = protocols?.filter((item) => item.id !== protocol?.id) || [];

  if (protocols === undefined) return <div className="p-10 text-sm text-muted-foreground">Loading protocol…</div>;

  if (!protocol) {
    return (
      <div className="max-w-lg mx-auto px-6 py-32 text-center">
        <h1 className="text-2xl font-light text-foreground">No active protocol yet.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Complete your assessment and AQLA will assign your first protocol.</p>
        <Link to="/assessment" className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-medium">
          Start Assessment <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">Current protocol · {protocol.family}</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-light text-foreground">{protocol.name}</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">{protocol.objective}</p>

      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm aqla-panel rounded-2xl px-5 md:px-6 py-5">
        <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Started</p><p className="mt-1 text-foreground tabular-nums">{protocol.start_date || "—"}</p></div>
        <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Review date</p><p className="mt-1 text-foreground tabular-nums">{protocol.review_date || "—"}</p></div>
        <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Duration</p><p className="mt-1 text-foreground tabular-nums">{protocol.duration_days ? `${protocol.duration_days} days` : "—"}</p></div>
      </div>

      <div className="mt-6">
        <DailyPlanPdfButton user={user} protocol={protocol} checkIns={checkIns} domains={domains} />
      </div>

      {protocol.why_selected && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-foreground mb-3">Why it was selected</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{protocol.why_selected}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg text-foreground mb-4">Daily actions</h2>
        <div className="space-y-px rounded-2xl overflow-hidden border border-border/60">
          {(protocol.actions || []).map((a, i) => (
            <div key={i} className="flex items-center gap-4 md:gap-5 bg-card/60 px-4 md:px-6 py-4 md:py-5">
              <span className="font-display text-xl text-primary/70 tabular-nums">0{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm text-foreground">{a.title}</p>
                {a.detail && <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>}
              </div>
              {a.time && <span className="text-xs text-muted-foreground tabular-nums">{a.time}</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-foreground mb-1">Evidence-backed daily actions</h2>
        <p className="text-xs text-muted-foreground mb-4">The science behind each habit in your protocol. Tap any card to see the evidence.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {LIFESTYLE_EVIDENCE.map((action) => (
            <EvidenceActionCard key={action.id} action={action} />
          ))}
        </div>
      </section>

      {protocol.expected_benefits?.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-foreground mb-3">Expected benefits</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {protocol.expected_benefits.map((b) => <li key={b} className="flex gap-2"><span className="text-primary">+</span>{b}</li>)}
          </ul>
        </section>
      )}

      {protocol.measuring?.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-foreground mb-3">What AQLA is measuring</h2>
          <div className="flex flex-wrap gap-2">
            {protocol.measuring.map((m) => (
              <span key={m} className="px-4 py-2 rounded-full border border-border text-xs text-muted-foreground">{m}</span>
            ))}
          </div>
        </section>
      )}

      {protocol.safety_notes && (
        <section className="mt-10 rounded-2xl border border-[#F2C04E]/25 bg-[#F2C04E]/5 p-5 md:p-6 flex gap-3 md:gap-4">
          <Shield className="w-5 h-5 text-[#F2C04E] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-sm text-foreground font-medium">Safety notes</p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{protocol.safety_notes}</p>
          </div>
        </section>
      )}

      {otherPlans.length > 0 && (
        <section className="mt-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Plan library</p>
          <h2 className="mt-2 font-display text-2xl text-foreground">Other performance plans</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {otherPlans.map((plan) => <ProtocolPlanCard key={plan.id} plan={plan} />)}
          </div>
        </section>
      )}

      <div className="mt-10">
        <Link to="/protocols" className="text-sm text-primary hover:underline inline-flex items-center gap-1.5">
          Explore the five protocol families <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}