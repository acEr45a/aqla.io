// Central AI compute for every admin surface. All LLM work in the app runs through
// runOpsTask — panels and the Backend Ops agent only supply a task name + args.
import { generateObject } from 'npm:ai@7.0.16';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible@3.0.5';
import { z } from 'npm:zod@4.4.3';
import { refinePrompt, wordbankPrompt } from './devIdeas.js';

const tierEnum = z.enum(["big_idea", "feature", "improvement", "small_fix"]);

const ideaShape = {
  title: z.string(),
  summary: z.string(),
  detail: z.string(),
  tier: tierEnum,
  impact: z.string(),
  effort: z.string(),
  steps: z.array(z.string()),
};

export const THEME_KEYS = ["bg", "panel", "border", "text", "muted", "faint", "accent", "positive", "negative", "warning"];

export const THEME_DEFAULTS = {
  bg: "#0A0A0A", panel: "#121212", border: "#262626", text: "#FFFFFF", muted: "#A3A3A3",
  faint: "#6B6B6B", accent: "#8B5CF6", positive: "#4ADE80", negative: "#F87171", warning: "#FBBF24",
};

function themePrompt(current, instruction) {
  return `You are the theme editor for AQLA's "Fable" PDF design system: a clinical, high-contrast, grid-based dark document style.
Current theme (6-digit hex): ${JSON.stringify(current)}
Key roles: bg = page background (must stay very dark, near #0A0A0A), panel = card fill (slightly lighter than bg), border = hairlines,
text = primary text (must contrast strongly with bg), muted = secondary text, faint = small labels, accent = the single accent color used
for rules, key numbers and charts, positive/negative = trend colors, warning = caution notices.
Admin instruction: "${instruction}"
Return the FULL updated theme. Change only what the instruction asks and keep everything else identical. All values must be 6-digit hex
like #8B5CF6. Never make bg light and never let text blend into bg. Also return a one-sentence note describing what you changed.`;
}

/* Build a strictly-clinical, PII-stripped payload for a single member.
   Used by the clinician AI composer so the model never sees emails, internal
   IDs, or admin-only records — only the clinical context needed to draft. */
async function buildClinicianPayload(base44, userId) {
  const svc = base44.asServiceRole;
  const [user, protocols, checkIns, cognitiveTests, brainDomains, assessments, healthProfiles] = await Promise.all([
    svc.entities.User.get(userId).catch(() => null),
    svc.entities.Protocol.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.DailyCheckIn.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.CognitiveTest.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.BrainDomain.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.Assessment.filter({ created_by_id: userId }).catch(() => []),
    svc.entities.HealthProfile.filter({ created_by_id: userId }).catch(() => []),
  ]);

  const activeProtocol = (protocols || []).find((p) => p.status === "active") || (protocols || [])[0] || null;
  const latestAssessment = (assessments || [])[0] || null;
  const latestHealth = (healthProfiles || [])[0] || null;

  const recentCheckIns = [...(checkIns || [])]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 14)
    .map((c) => ({
      date: c.date,
      clarity: c.clarity,
      energy: c.energy,
      stress: c.stress,
      sleep_quality: c.sleep_quality,
      demand: c.demand || null,
      side_effects: c.side_effects || null,
      note: c.note || null,
      valid: c.valid !== false,
    }));

  const avg = (arr, key) => {
    const v = arr.map((c) => c[key]).filter((x) => x != null);
    return v.length ? Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)) : null;
  };

  return {
    member_first_name: (user?.full_name || "the member").split(" ")[0],
    goal: latestAssessment?.responses?.goal || null,
    protocol: activeProtocol
      ? {
          name: activeProtocol.name,
          family: activeProtocol.family,
          objective: activeProtocol.objective || null,
          status: activeProtocol.status,
          start_date: activeProtocol.start_date || null,
          review_date: activeProtocol.review_date || null,
          actions: activeProtocol.actions || [],
          safety_notes: activeProtocol.safety_notes || null,
        }
      : null,
    safety_screening: latestHealth
      ? {
          eligibility_status: latestHealth.eligibility_status || null,
          flags: latestHealth.flags || [],
        }
      : null,
    check_ins_last_14: recentCheckIns,
    check_in_averages: {
      clarity: avg(recentCheckIns, "clarity"),
      energy: avg(recentCheckIns, "energy"),
      stress: avg(recentCheckIns, "stress"),
      sleep_quality: avg(recentCheckIns, "sleep_quality"),
    },
    cognitive_tests: (cognitiveTests || [])
      .filter((t) => t.valid !== false)
      .map((t) => ({ test_type: t.test_type, normalized_score: t.normalized_score, completed_date: t.completed_date })),
    brain_domains: (brainDomains || []).map((d) => ({
      domain_name: d.domain_name,
      score: d.score,
      trend: d.trend,
      summary: d.summary || null,
    })),
    assessment_responses: latestAssessment?.responses || null,
  };
}

function clinicianDraftPrompt(payload, intent, note) {
  const intentMap = {
    check_in: "a warm follow-up on their recent daily check-ins and how they're doing",
    protocol_review: "a note tied to their current protocol — progress, adherence, or review",
    safety_follow_up: "a careful safety follow-up acknowledging any safety flags, without diagnosing",
    progress_acknowledgment: "a brief acknowledgment of their recent progress and momentum",
    general: "a general supportive clinical note",
  };
  const focus = intentMap[intent] || intentMap.general;
  return `You are the AQLA Clinician Composer, drafting a short message FROM a clinician TO a member, grounded strictly in the member's recorded clinical data below.

STRICT ZERO-HALLUCINATION RULES:
- Ground every observation ONLY in the data provided. Never use outside knowledge about this person.
- Cite concrete data inline when relevant (e.g. "your average clarity was 6.2/10 this week", "protocol day 9 of 14").
- Never diagnose, never prescribe, never recommend specific supplement dosing. If safety flags are present, acknowledge support and encourage the member to continue sharing — do not name a condition.
- If data is insufficient for a point, keep the message general rather than infer.
- Keep it warm, human, and concise: 3-5 sentences. Address the member by their first name: ${payload.member_first_name}.
- Do not include emails, IDs, or internal system references.
- Do not claim to be a doctor or to have reviewed lab results unless the data explicitly contains them.

INTENT: Draft ${focus}.
${note ? `CLINICIAN FOCUS: "${note}"\n` : ""}
MEMBER CLINICAL DATA:
${JSON.stringify(payload, null, 2)}

Return a JSON object with a single "draft" string containing the message body (no greeting signature line).`;
}

/* Dispatch a single AI task. `base44` must be an authenticated admin or clinician client. */
export async function runOpsTask(base44, { task, raw, source, focus, instruction, user_id, intent, note }) {
  const { baseURL, token } = base44.asServiceRole.aiGateway.connection();
  const models = createOpenAICompatible({ name: 'base44', baseURL, apiKey: token, supportsStructuredOutputs: true });

  if (task === 'refineIdea') {
    const text = (raw || '').trim();
    if (!text) return { error: 'Missing idea text', status: 400 };
    const { object } = await generateObject({
      model: models('automatic'),
      schema: z.object(ideaShape),
      prompt: refinePrompt(text),
    });
    const idea = await base44.entities.DevIdea.create({
      ...object, raw_input: text, status: 'open', source: source || 'chat',
    });
    return { ok: true, idea };
  }

  if (task === 'wordbank') {
    const [existingBank, existingChecklist] = await Promise.all([
      base44.entities.DevWordbankIdea.list('-created_date', 60),
      base44.entities.DevIdea.list('-created_date', 60),
    ]);
    const titles = [...existingBank, ...existingChecklist].map((i) => i.title);
    const { object } = await generateObject({
      model: models('automatic'),
      schema: z.object({ ideas: z.array(z.object({ ...ideaShape, area: z.string() })) }),
      prompt: wordbankPrompt(titles, focus || ''),
    });
    const ideas = await base44.entities.DevWordbankIdea.bulkCreate(object.ideas.map((i) => ({ ...i, used: false })));
    return { ok: true, count: object.ideas.length, ideas };
  }

  if (task === 'pdfTheme') {
    if (!instruction || !String(instruction).trim()) return { error: 'Missing instruction', status: 400 };
    const existing = await base44.entities.PdfTheme.list('-updated_date', 1);
    const current = { ...THEME_DEFAULTS, ...(existing[0]?.config || {}) };
    const shape = {};
    THEME_KEYS.forEach((k) => { shape[k] = z.string(); });
    const { object } = await generateObject({
      model: models('automatic'),
      schema: z.object({ theme: z.object(shape), note: z.string() }),
      prompt: themePrompt(current, instruction),
    });
    const clean = {};
    THEME_KEYS.forEach((k) => {
      const v = object.theme?.[k];
      clean[k] = typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v) ? v.toUpperCase() : current[k];
    });
    if (existing[0]) await base44.entities.PdfTheme.update(existing[0].id, { config: clean, note: object.note });
    else await base44.entities.PdfTheme.create({ config: clean, note: object.note });
    return { ok: true, theme: clean, note: object.note };
  }

  if (task === 'draftClinicianMessage') {
    if (!user_id) return { error: 'user_id is required', status: 400 };
    const payload = await buildClinicianPayload(base44, user_id);
    const { object } = await generateObject({
      model: models('automatic'),
      schema: z.object({ draft: z.string() }),
      prompt: clinicianDraftPrompt(payload, intent || 'general', note || ''),
    });
    return { ok: true, draft: object.draft || '' };
  }

  return { error: `Unknown task: ${task}`, status: 400 };
}