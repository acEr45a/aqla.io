import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import ReviewCard from "@/components/clinician/ReviewCard";
import PlanDecisionCard from "@/components/clinician/PlanDecisionCard";
import SendToAdminCard from "@/components/clinician/SendToAdminCard";
import ClinicalFlagsPanel from "@/components/clinician/ClinicalFlagsPanel";
import ClinicianInbox from "@/components/clinician/ClinicianInbox";
import MemberProfilePanel from "@/components/clinician/MemberProfilePanel";
import ClinicianAlerts from "@/components/clinician/ClinicianAlerts";
import { notify } from "@/lib/clinicianToast";
import { Stethoscope, Search, ShieldAlert, ArrowUpDown, Clock, CheckCircle2, Users } from "lucide-react";

const TABS = [
  { id: "inbox", label: "Inbox" },
  { id: "members", label: "Members" },
  { id: "flags", label: "Flags" },
  { id: "reviews", label: "Reviews" },
];

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
  const [tab, setTab] = useState("inbox");
  const [allowed, setAllowed] = useState(null);
  const [members, setMembers] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [cognitiveTests, setCognitiveTests] = useState([]);
  const [brainDomains, setBrainDomains] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [flags, setFlags] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [plans, setPlans] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [reviewQuery, setReviewQuery] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [revertingId, setRevertingId] = useState(null);
  const [revertError, setRevertError] = useState(null);
  const [revertedId, setRevertedId] = useState(null);
  const [selected, setSelected] = useState(null); // { member, section }

  const loadMemberData = async () => {
    try {
      const res = await base44.functions.invoke("getMemberData", {});
      const d = res.data || {};
      setMembers(d.members || []);
      setCheckIns(d.checkIns || []);
      setCognitiveTests(d.cognitiveTests || []);
      setBrainDomains(d.brainDomains || []);
      setExperiments(d.experiments || []);
    } catch {
      setMembers([]);
    }
  };

  const loadFlags = () => base44.entities.ClinicalFlag.list("-created_date", 200).then(setFlags).catch(() => setFlags([]));
  const loadReviews = () => base44.entities.ClinicianReview.list("-created_date", 50).then(setReviews);
  const loadPlans = () => base44.entities.PlanReview.list("-completed_date", 100).then(setPlans).catch(() => setPlans([]));
  const loadRecs = () => base44.entities.MemberRecommendation.list("-created_date", 200).then(setRecommendations).catch(() => setRecommendations([]));

  const loadAll = () => {
    loadMemberData();
    loadFlags();
    loadReviews();
    loadPlans();
    loadRecs();
  };

  useEffect(() => {
    base44.auth.me()
      .then((user) => {
        const ok = user && (user.role === "clinician" || user.role === "admin");
        setAllowed(ok);
        if (ok) loadAll();
      })
      .catch(() => setAllowed(false));
  }, []);

  const openMember = (userId, section) => {
    const member = (members || []).find((m) => m.id === userId);
    if (!member) return;
    setSelected({ member, section: section || "overview" });
  };

  const closeMember = () => setSelected(null);

  const revertPlan = async (review) => {
    if (!review?.id || revertingId) return;
    setRevertingId(review.id);
    setRevertError(null);
    setRevertedId(null);
    try {
      const res = await base44.functions.invoke("revertPlanChange", { plan_review_id: review.id });
      if (res.data?.ok) {
        setRevertedId(review.id);
        notify("Plan reverted", `Reverted the plan decision for this member.`);
        loadAll();
      } else {
        setRevertError(review.id);
      }
    } catch {
      setRevertError(review.id);
    }
    setRevertingId(null);
  };

  // Selected member's filtered grouped data for the profile panel.
  const selectedData = useMemo(() => {
    if (!selected?.member) return { checkIns: [], cognitiveTests: [], brainDomains: [], experiments: [], openFlagsCount: 0 };
    const id = selected.member.id;
    return {
      checkIns: checkIns.filter((c) => c.user_id === id).slice(0, 14),
      cognitiveTests: cognitiveTests.filter((t) => t.user_id === id),
      brainDomains: brainDomains.filter((d) => d.user_id === id),
      experiments: experiments.filter((e) => e.user_id === id),
      openFlagsCount: (flags || []).filter((f) => f.user_id === id && f.status === "pending").length,
    };
  }, [selected, checkIns, cognitiveTests, brainDomains, experiments, flags]);

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return members || [];
    return (members || []).filter((m) => m.name.toLowerCase().includes(q) || (m.protocol?.name || "").toLowerCase().includes(q));
  }, [members, memberQuery]);

  const reviewMatches = (r) => {
    const q = reviewQuery.trim().toLowerCase();
    if (!q) return true;
    return [r.user_name, r.goal, r.recommendation, r.evidence_level, r.ai_reasoning].filter(Boolean).some((s) => s.toLowerCase().includes(q));
  };
  const sortByUrgency = (list) => urgentOnly ? [...list].sort((a, b) => (b.safety_flags?.length || 0) - (a.safety_flags?.length || 0)) : list;
  const pendingReviews = useMemo(() => sortByUrgency((reviews?.filter((r) => r.status === "pending") || []).filter(reviewMatches)), [reviews, reviewQuery, urgentOnly]);
  const doneReviews = useMemo(() => sortByUrgency((reviews?.filter((r) => r.status !== "pending") || []).filter(reviewMatches)), [reviews, reviewQuery, urgentOnly]);

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      <ClinicianAlerts onNew={loadAll} />
      <div className="flex items-center gap-3">
        <Stethoscope className="w-6 h-6 text-primary" strokeWidth={1.5} />
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-foreground">Clinician dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Triage-first clinical workspace</p>
        </div>
      </div>

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-6 pb-1 bg-background/90 backdrop-blur-sm">
        <div className="flex rounded-full bg-secondary/60 p-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 rounded-full px-3 py-2 text-xs transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <STAT icon={Clock} label="Awaiting" value={pendingCount} accent="#F2C04E" />
        <STAT icon={ShieldAlert} label="Safety flags" value={safetyCount} accent="#E8756B" />
        <STAT icon={CheckCircle2} label="Decided" value={decidedCount} accent="#C9F24E" />
        <STAT icon={Users} label="Members" value={members === null ? "—" : members.length} accent="#7B94FF" />
      </div>

      {/* INBOX TAB */}
      {tab === "inbox" && (
        <section className="mt-8">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-4">Triage inbox</p>
          <ClinicianInbox
            flags={flags}
            reviews={reviews}
            members={members}
            recommendations={recommendations}
            planReviews={plans}
            onOpenMember={openMember}
          />
        </section>
      )}

      {/* MEMBERS TAB */}
      {tab === "members" && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground tracking-widest uppercase">
              Member directory · <span className="text-foreground tabular-nums">{members === null ? "—" : members.length}</span>
            </p>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="Search members…"
              className="w-full rounded-full border border-border bg-secondary/40 pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          </div>
          {members === null ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse bg-secondary/40 rounded-2xl" />)}</div>
          ) : filteredMembers.length === 0 ? (
            <div className="aqla-panel rounded-2xl p-6 text-center text-sm text-muted-foreground">No members found.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredMembers.map((m) => (
                <button key={m.id} onClick={() => openMember(m.id, "overview")}
                  className="text-left aqla-panel rounded-2xl p-4 hover:border-primary/30 transition-colors">
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.protocol ? `${m.protocol.family} · ${m.protocol.name}` : "No active protocol"}</p>
                  {m.safety_screening?.flags?.length > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#E8A28F]">
                      <ShieldAlert className="w-3 h-3" /> {m.safety_screening.flags.length} safety flag(s)
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FLAGS TAB */}
      {tab === "flags" && (
        <section className="mt-8">
          <ClinicalFlagsPanel onOpenMember={openMember} onAction={() => { loadFlags(); loadReviews(); }} />
        </section>
      )}

      {/* REVIEWS TAB */}
      {tab === "reviews" && (
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={reviewQuery} onChange={(e) => setReviewQuery(e.target.value)} placeholder="Search members, goals, recommendations…"
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
              <p className="mt-8 text-xs text-muted-foreground tracking-widest uppercase mb-4">
                Awaiting review · <span className="text-foreground tabular-nums">{pendingReviews.length}</span>
              </p>
              {pendingReviews.length === 0 ? (
                <div className="aqla-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">
                  {reviewQuery || urgentOnly ? "No reviews match your filters." : "No recommendations are currently awaiting review."}
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReviews.map((r) => <ReviewCard key={r.id} review={r} onUpdate={loadAll} onOpenMember={openMember} />)}
                </div>
              )}
              {doneReviews.length > 0 && (
                <div className="mt-12">
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-4">
                    Decision history · <span className="tabular-nums text-foreground">{doneReviews.length}</span>
                  </p>
                  <div className="space-y-4">
                    {doneReviews.map((r) => <ReviewCard key={r.id} review={r} onUpdate={loadAll} onOpenMember={openMember} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Escalate + plan decisions — shared across bottom regardless of tab */}
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
              {plans.map((p) => (
                <PlanDecisionCard key={p.id} review={p} onRevert={revertPlan} revertingId={revertingId} revertError={revertError} revertedId={revertedId} />
              ))}
            </div>
          )}
        </section>
      )}

      <p className="mt-12 text-[11px] text-muted-foreground border-t border-border/50 pt-6">
        All decisions are logged with a timestamp. AI-proposed recommendations never bypass this review when safety flags are present.
      </p>

      <MemberProfilePanel
        open={!!selected}
        onClose={closeMember}
        member={selected?.member}
        checkIns={selectedData.checkIns}
        cognitiveTests={selectedData.cognitiveTests}
        brainDomains={selectedData.brainDomains}
        openFlagsCount={selectedData.openFlagsCount}
        initialSection={selected?.section}
        onChanged={loadAll}
      />
    </div>
  );
}