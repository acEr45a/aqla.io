import { base44 } from "@/api/base44Client";

// Inline note appended to flagged user-facing agent messages.
export const CLINICAL_NOTE = "Clinically noted — a clinician may review and follow up.";

// Keywords that signal clinical content (supplement dosing, safety, protocol
// changes, drug interactions, mental-health signals). Detection is a safety
// net — it intentionally over-matches so borderline content reaches a clinician.
const KEYWORDS = [
  "mg", "milligram", "mcg", "dose", "dosage", "supplement", "stack", "take ", "capsule",
  "safety", "warning", "contraindicat", "side effect", "adverse", "tolerance",
  "interaction", "interact with", "medication", "drug", "prescription", "pharma",
  "switch your protocol", "change your plan", "new protocol", "plan change", "switch to", "move you to",
  "depression", "anxiety", "mood", "mental health", "suicid", "panic", "trauma", "insomnia", "withdrawal",
  "caffeine", "stimulant", "melatonin", "ashwagandha", "l-theanine", "theanine", "rhodiola", "omega", "magnesium", "ginseng", "bacopa"
];

export function detectClinicalContent(text) {
  const t = (text || "").toLowerCase();
  if (!t) return false;
  return KEYWORDS.some((k) => t.includes(k));
}

export function snippet(text, n = 300) {
  return (text || "").slice(0, n);
}

// Auto-flag a user-facing agent response. Creates a ClinicalFlag (auto) and
// notifies clinicians via the backend broadcast function. Returns true if flagged.
export async function autoFlagResponse({ sourceAgent, message, user }) {
  if (!detectClinicalContent(message)) return false;
  try {
    await base44.entities.ClinicalFlag.create({
      flag_type: "auto",
      source_agent: sourceAgent,
      message_snippet: snippet(message),
      user_id: user?.id || null,
      user_name: user?.full_name || user?.email || null,
      admin_id: null,
      admin_name: null,
      status: "pending",
    });
    base44.functions
      .invoke("notifyCliniciansOfFlag", {
        source_agent: sourceAgent,
        message_snippet: snippet(message),
        user_name: user?.full_name || user?.email || "a member",
      })
      .catch(() => {});
  } catch {
    /* never block the conversation on flag failure */
  }
  return true;
}

// Manual flag raised by an admin from the Architect widget.
export async function manualFlagResponse({ message, admin }) {
  try {
    await base44.entities.ClinicalFlag.create({
      flag_type: "manual",
      source_agent: "architect",
      message_snippet: snippet(message),
      user_id: null,
      user_name: null,
      admin_id: admin?.id || null,
      admin_name: admin?.full_name || admin?.email || null,
      status: "pending",
    });
    return true;
  } catch {
    return false;
  }
}

// AI-draft a constrained clinician follow-up to the member. The draft may only
// summarise what the assistant said and ask one clarifying question — no new
// clinical claims, dosing, or diagnoses.
export async function draftFollowUp({ messageSnippet, userName }) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are drafting a short follow-up message from an AQLA clinician to a member, based on a flagged AI assistant message.

STRICT RULES:
- Only summarise what the assistant already said — never introduce new clinical claims, supplement dosing, or diagnoses.
- End with exactly one clarifying question.
- Keep it warm and human, 2-4 sentences.
- Address the member by name if known: ${userName || "there"}.
- Do not claim the member has a condition.

Flagged assistant message:
"""
${messageSnippet}
"""`,
    response_json_schema: {
      type: "object",
      properties: { draft: { type: "string" } },
      required: ["draft"],
    },
  });
  return res?.draft || "";
}