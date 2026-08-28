import React, { useEffect, useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { apiClient } from "@/api/apiClient";
import { autoFlagResponse } from "@/lib/clinicalFlag";
import { notify } from "@/lib/clinicianToast";
import { localDateKey } from "@/lib/dateKey";
import { CHAPTERS } from "@/lib/assessmentData";
import CheckInSparklines from "@/components/clinician/CheckInSparklines";
import CognitiveScoreGauges from "@/components/clinician/CognitiveScoreGauges";
import AiComposer from "@/components/clinician/AiComposer";
import { Sparkles, RefreshCw, Loader2, Activity, ShieldAlert, ClipboardList, Brain, Send, AlertTriangle, PenLine } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "checkins", label: "Check-ins" },
  { id: "protocol", label: "Protocol" },
  { id: "assessment", label: "Assessment" },
  { id: "safety", label: "Safety" },
  { id: "cognitive", label: "Cognitive" },
  { id: "actions", label: "Actions" },
];

const PLAN_FAMILIES = ["SPARK", "FLOW", "DRIVE", "LEARN", "RESET", "DIGITAL"];
const REC_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "protocol", label: "Protocol" },
  { value: "safety", label: "Safety" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "follow_up", label: "Follow-up" },
];

function VitalsStrip({ member, checkIns, openFlagsCount }) {
  const today = localDateKey();
  const daysOnProtocol = member.protocol?.start_date
    ? Math.max(0, Math.floor((new Date(today) - new Date(member.protocol.start_date)) / 86400000))
    : null;
  const lastCheckIn = checkIns?.[0]?.date || null;
  const eligibility = member.safety_screening?.eligibility_status || "Not screened";
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="aqla-panel rounded-xl p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Days on protocol</p>
        <p className="mt-1 font-display text-lg text-foreground tabular-nums">{daysOnProtocol != null ? daysOnProtocol : "—"}</p>
      </div>
      <div className="aqla-panel rounded-xl p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Last check-in</p>
        <p className="mt-1 font-display text-lg text-foreground tabular-nums">{lastCheckIn || "—"}</p>
      </div>
      <div className="aqla-panel rounded-xl p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Eligibility</p>
        <p className="mt-1 text-sm text-foreground truncate">{eligibility}</p>
      </div>
      <div className="aqla-panel rounded-xl p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Open flags</p>
        <p className="mt-1 font-display text-lg tabular-nums" style={{ color: openFlagsCount > 0 ? "#E8A28F" : "inherit" }}>{openFlagsCount}</p>
      </div>
    </div>
  );
}

function AiSummary({ member, checkIns, cognitiveTests, brainDomains }) {
  const [bullets, setBullets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const avg = (arr, key) => {
        const v = (arr || []).map((c) => c[key]).filter((x) => x != null);
        return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null;
      };
      const daysRemaining = member.protocol?.review_date
        ? Math.ceil((new Date(member.protocol.review_date) - new Date(localDateKey())) / 86400000)
        : null;

      const payload = {
        name: member.name,
        protocol: member.protocol ? {
          name: member.protocol.name, family: member.protocol.family,
          objective: member.protocol.objective, why_selected: member.protocol.why_selected,
          start_date: member.protocol.start_date, review_date: member.protocol.review_date,
          days_remaining: daysRemaining,
        } : null,
        safety_screening: member.safety_screening,
        check_ins_last_14: (checkIns || []).slice(0, 14).map((c) => ({
          date: c.date, clarity: c.clarity, energy: c.energy, stress: c.stress, sleep_quality: c.sleep_quality,
        })),
        check_in_averages: {
          clarity: avg(checkIns, "clarity"), energy: avg(checkIns, "energy"),
          stress: avg(checkIns, "stress"), sleep_quality: avg(checkIns, "sleep_quality"),
        },
        cognitive_tests: (cognitiveTests || []).map((t) => ({ test_type: t.test_type, normalized_score: t.normalized_score })),
        brain_domains: (brainDomains || []).map((d) => ({ name: d.domain_name, score: d.score, trend: d.trend })),
        assessment_responses: member.assessment?.responses || {},
      };

      const res = await apiClient.integrations.Core.InvokeLLM({
        prompt: `You are AQLA Clinical Summary, generating a concise clinical overview for a clinician reviewing an AQLA member.

STRICT ZERO-HALLUCINATION RULES:
- Ground every observation ONLY in the data provided below. Never use outside knowledge about this person.
- Cite specific data points inline (e.g. "average clarity 6.2/10 over last 7 days", "protocol day 9 of 14").
- Never make claims not supported by the provided data. Never diagnose, never recommend dosing, never prescribe.
- If data is insufficient for an observation, state that explicitly (e.g. "Insufficient check-in data to assess trend") rather than infer.
- If an observation touches supplements, dosing, or safety, add: "requires clinician review".
- Produce 3 to 5 concise bullet observations.

MEMBER DATA:
${JSON.stringify(payload, null, 2)}

Return a JSON object with a "bullets" array of 3-5 strings.`,
        response_json_schema: {
          type: "object",
          properties: { bullets: { type: "array", items: { type: "string" } } },
          required: ["bullets"],
        },
      });
      const out = (res?.bullets || []).filter(Boolean);
      setBullets(out.length ? out : ["No observations generated."]);
      // Auto-flag if the summary contains clinical content (supplements/dosing/safety).
      const fullText = out.join(" ");
      if (fullText) {
        const flagged = await autoFlagResponse({ sourceAgent: "clinician_summary", message: fullText, user: { id: member.id, full_name: member.name } });
        if (flagged) notify("Clinical content flagged", "Summary contained clinical content — added to clinician review queue.");
      }
    } catch {
      setError("Could not generate summary.");
    }
    setLoading(false);
  };

  useEffect(() => { if (member?.id) run(); /* eslint-disable-next-line */ }, [member?.id]);

  return (
    <div className="aqla-panel rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-widest text-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> AQLA Clinical Summary
        </p>
        <button onClick={run} disabled={loading}
          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Regenerate
        </button>
      </div>
      {loading && !bullets ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Analyzing recorded data…</div>
      ) : error ? (
        <p className="mt-4 text-sm text-[#E8A28F]">{error}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {bullets?.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground/90 leading-relaxed">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /> {b}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[10px] text-muted-foreground border-t border-border/40 pt-3">
        Generated from recorded data only — not a clinical diagnosis.
      </p>
    </div>
  );
}

function CheckInsTab({ checkIns }) {
  const ordered = [...(checkIns || [])].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 14);
  return (
    <div className="space-y-5">
      <CheckInSparklines checkIns={ordered} />
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Raw values</p>
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">Date</th>
                <th className="py-1.5 pr-3 font-medium">Clarity</th>
                <th className="py-1.5 pr-3 font-medium">Energy</th>
                <th className="py-1.5 pr-3 font-medium">Stress</th>
                <th className="py-1.5 pr-3 font-medium">Sleep</th>
                <th className="py-1.5 font-medium">Demand</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((c) => (
                <tr key={c.id} className="border-t border-border/40 text-foreground/80">
                  <td className="py-1.5 pr-3 tabular-nums">{c.date}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.clarity ?? "—"}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.energy ?? "—"}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.stress ?? "—"}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.sleep_quality ?? "—"}</td>
                  <td className="py-1.5 text-muted-foreground">{c.demand || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProtocolTab({ protocol }) {
  if (!protocol) return <p className="text-sm text-muted-foreground">No active protocol.</p>;
  const today = localDateKey();
  const daysRemaining = protocol.review_date ? Math.ceil((new Date(protocol.review_date) - new Date(today)) / 86400000) : null;
  return (
    <div className="space-y-4 text-sm">
      <div className="aqla-panel rounded-xl p-4">
        <p className="font-display text-foreground">{protocol.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{protocol.family} · {protocol.status}</p>
      </div>
      <Field label="Objective" value={protocol.objective} />
      <Field label="Why selected" value={protocol.why_selected} />
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Actions</p>
        {protocol.actions?.length ? (
          <ol className="space-y-2">
            {protocol.actions.map((a, i) => (
              <li key={i} className="aqla-panel rounded-xl p-3">
                <p className="text-foreground/90">{a.title}</p>
                {a.detail && <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>}
                {a.time && <p className="mt-1 text-[10px] text-muted-foreground">{a.time}</p>}
              </li>
            ))}
          </ol>
        ) : <p className="text-muted-foreground">No actions defined.</p>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MiniStat label="Start date" value={protocol.start_date || "—"} />
        <MiniStat label="Review date" value={protocol.review_date || "—"} />
        <MiniStat label="Days remaining" value={daysRemaining != null ? daysRemaining : "—"} />
      </div>
      {protocol.supporting_actions?.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Supporting actions</p>
          <ul className="space-y-1">{protocol.supporting_actions.map((a) => <li key={a} className="flex gap-2 text-foreground/80"><span className="text-primary">·</span>{a}</li>)}</ul>
        </div>
      )}
      {protocol.safety_notes && <Field label="Safety notes" value={protocol.safety_notes} />}
      {protocol.expected_benefits?.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Expected benefits</p>
          <ul className="space-y-1">{protocol.expected_benefits.map((b) => <li key={b} className="flex gap-2 text-foreground/80"><span className="text-primary">·</span>{b}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function AssessmentTab({ assessment }) {
  if (!assessment?.responses) return <p className="text-sm text-muted-foreground">No onboarding assessment on file.</p>;
  const responses = assessment.responses;
  return (
    <div className="space-y-5 text-sm">
      {CHAPTERS.map((ch) => (
        <div key={ch.id}>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{ch.title}</p>
          <div className="space-y-2">
            {ch.questions.map((q) => {
              const raw = responses[q.key];
              if (raw == null || raw === "") return null;
              const label = q.type === "choice" ? q.options?.find((o) => o.value === raw)?.label || raw : raw;
              return (
                <div key={q.key} className="aqla-panel rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">{q.label}</p>
                  <p className="mt-0.5 text-foreground/90">{label}{q.type === "scale" ? ` (${raw}/5)` : ""}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SafetyTab({ screening }) {
  if (!screening) return <p className="text-sm text-muted-foreground">No safety screening on file.</p>;
  return (
    <div className="space-y-4 text-sm">
      <div className="aqla-panel rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Eligibility status</p>
        <p className="mt-1 text-foreground">{screening.eligibility_status || "Not set"}</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Safety flags</p>
        {screening.flags?.length ? (
          <div className="flex flex-wrap gap-2">
            {screening.flags.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8756B]/15 text-[#E8A28F] text-xs">
                <ShieldAlert className="w-3 h-3" /> {f}
              </span>
            ))}
          </div>
        ) : <p className="text-muted-foreground">No safety flags.</p>}
      </div>
      {screening.completed_date && (
        <p className="text-[11px] text-muted-foreground">Screening completed {new Date(screening.completed_date).toLocaleDateString()}</p>
      )}
    </div>
  );
}

function ActionsTab({ member, onChanged }) {
  const [recDraft, setRecDraft] = useState({ title: "", message: "", category: "general" });
  const [sendingRec, setSendingRec] = useState(false);
  const [planDraft, setPlanDraft] = useState({ family: member.protocol?.family || "", reason: "" });
  const [changingPlan, setChangingPlan] = useState(false);
  const [planMsg, setPlanMsg] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const sendRec = async () => {
    if (!recDraft.message.trim() || sendingRec) return;
    setSendingRec(true);
    try {
      await apiClient.functions.invoke("pushMemberRecommendation", {
        user_id: member.id, title: recDraft.title, message: recDraft.message, category: recDraft.category,
      });
      notify("Recommendation sent", `Sent to ${member.name} — will appear on their dashboard.`);
      setRecDraft({ title: "", message: "", category: "general" });
      onChanged?.();
    } catch {
      notify("Could not send", "Please try again.");
    }
    setSendingRec(false);
  };

  const changePlan = async () => {
    if (!planDraft.family || changingPlan) return;
    if (planDraft.family === member.protocol?.family) { setPlanMsg("That's already their active plan."); return; }
    setChangingPlan(true);
    setPlanMsg("");
    try {
      const res = await apiClient.functions.invoke("changeMemberPlan", {
        user_id: member.id, family: planDraft.family, reason: planDraft.reason,
      });
      if (res.data?.ok) {
        notify("Plan updated", `${member.name} moved to ${planDraft.family} — notified by pop-up and email.`);
        onChanged?.();
      } else {
        setPlanMsg(res.data?.error || "Could not change plan.");
      }
    } catch {
      setPlanMsg("Could not change plan.");
    }
    setChangingPlan(false);
  };

  return (
    <div className="space-y-5">
      {showComposer && (
        <AiComposer
          member={member}
          onClose={() => setShowComposer(false)}
          onSent={() => { onChanged?.(); setShowComposer(false); }}
        />
      )}

      <div className="aqla-panel rounded-2xl p-4 space-y-2.5">
        <p className="text-[11px] uppercase tracking-widest text-primary flex items-center gap-1.5">
          <PenLine className="w-3 h-3" /> AI composer
        </p>
        <p className="text-xs text-muted-foreground">
          Draft a member-facing message from this member's clinical data only — AQLA Intelligence strips identifiers and admin-only data before drafting.
        </p>
        <button onClick={() => setShowComposer(true)}
          className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
          Draft with AI
        </button>
      </div>

      <div className="aqla-panel rounded-2xl p-4 space-y-2.5">
        <p className="text-[11px] uppercase tracking-widest text-primary flex items-center gap-1.5">
          <Send className="w-3 h-3" /> Push recommendation
        </p>
        <input value={recDraft.title} onChange={(e) => setRecDraft({ ...recDraft, title: e.target.value })}
          placeholder="Title (optional)"
          className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none" />
        <select value={recDraft.category} onChange={(e) => setRecDraft({ ...recDraft, category: e.target.value })}
          className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none">
          {REC_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <textarea value={recDraft.message} onChange={(e) => setRecDraft({ ...recDraft, message: e.target.value })}
          placeholder="Your recommendation…" rows={3}
          className="w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground outline-none" />
        <button onClick={sendRec} disabled={sendingRec || !recDraft.message.trim()}
          className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {sendingRec ? "Sending…" : "Push & notify member"}
        </button>
      </div>

      <div className="aqla-panel rounded-2xl p-4 space-y-2.5">
        <p className="text-[11px] uppercase tracking-widest text-primary flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3" /> Change plan
        </p>
        <select value={planDraft.family} onChange={(e) => setPlanDraft({ ...planDraft, family: e.target.value })}
          className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none">
          <option value="">Select a plan family…</option>
          {PLAN_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <input value={planDraft.reason} onChange={(e) => setPlanDraft({ ...planDraft, reason: e.target.value })}
          placeholder="Reason / note for the member (optional)"
          className="w-full rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm text-foreground outline-none" />
        <button onClick={changePlan} disabled={changingPlan || !planDraft.family}
          className="w-full rounded-full border border-border px-4 py-2.5 text-sm text-foreground disabled:opacity-50">
          {changingPlan ? "Updating…" : "Change plan & notify member"}
        </button>
        {planMsg && <p className="text-xs text-[#E8A28F]">{planMsg}</p>}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground/90 leading-relaxed">{value}</p>
    </div>
  );
}
function MiniStat({ label, value }) {
  return (
    <div className="aqla-panel rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-sm text-foreground tabular-nums">{value}</p>
    </div>
  );
}

export default function MemberProfilePanel({ open, onClose, member, checkIns, cognitiveTests, brainDomains, openFlagsCount, initialSection, onChanged }) {
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (initialSection) setTab(initialSection);
  }, [initialSection, member?.id]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        {member && (
          <>
            <SheetHeader className="px-6 pt-6 pr-12 pb-3 border-b border-border/60">
              <SheetTitle className="text-xl">{member.name}</SheetTitle>
              <SheetDescription>{member.protocol ? `${member.protocol.family} · ${member.protocol.name}` : "No active protocol"}</SheetDescription>
            </SheetHeader>

            {/* Pill tab bar */}
            <div className="px-6 py-3 border-b border-border/60 overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5 min-w-max">
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground border border-border"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-5 space-y-5">
              {tab === "overview" && (
                <>
                  <AiSummary member={member} checkIns={checkIns} cognitiveTests={cognitiveTests} brainDomains={brainDomains} />
                  <VitalsStrip member={member} checkIns={checkIns} openFlagsCount={openFlagsCount} />
                </>
              )}
              {tab === "checkins" && <CheckInsTab checkIns={checkIns} />}
              {tab === "protocol" && <ProtocolTab protocol={member.protocol} />}
              {tab === "assessment" && <AssessmentTab assessment={member.assessment} />}
              {tab === "safety" && <SafetyTab screening={member.safety_screening} />}
              {tab === "cognitive" && <CognitiveScoreGauges tests={cognitiveTests} />}
              {tab === "actions" && <ActionsTab member={member} onChanged={onChanged} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}