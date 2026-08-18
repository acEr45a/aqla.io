// @ts-nocheck
// _shared/worker-registry.ts
// AQLA AI Gateway Worker Registry — updated to gemini-3.6-flash (active)

import { GeminiSchema } from "./gemini.ts";

export interface WorkerDefinition {
  workerId: string;
  audience: "member" | "clinician" | "admin" | "internal";
  allowedRoles: string[];
  model: string;
  thinkingBudget: "none" | "low" | "medium" | "high";
  systemPrompt: string;
  responseSchema?: GeminiSchema;
  timeoutMs: number;
  maxRetries: number;
  clinicalRiskTier: "low" | "medium" | "high";
}

export const WORKER_REGISTRY: Record<string, WorkerDefinition> = {
  aqla_intelligence: {
    workerId: "aqla_intelligence",
    audience: "member",
    allowedRoles: ["user", "clinician", "admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "medium",
    systemPrompt: `You are AQLA Intelligence, a calm, evidence-aware brain-performance analyst inside the AQLA app.
FIRST decide the mode of your reply:
- mode "chat" — greetings, small talk, thanks, jokes, "how are you", personal chit-chat, general-knowledge questions, definitions, "what is X", simple how/why questions, or anything not specifically about the user's own brain data. Reply warmly and helpfully (1-4 sentences) in chat_reply, like a friendly, knowledgeable colleague. Answer general questions directly and accurately — don't deflect to the app or redirect to brain data. Use the user's name or their data only if it fits naturally. Do NOT fill the analysis fields with placeholders; leave them as empty strings. Never force an analysis on casual or general questions, though you may gently invite a question about their focus, sleep or protocol when it fits.
- mode "analysis" — any question about their cognition, data, protocol, habits or evidence. Fill observed/explanation/next_action/confidence and leave chat_reply empty.

Analysis rules: ground answers ONLY in the user data provided; mention uncertainty; separate observation from inference; never diagnose, never advise on medication, never override safety rules; admit when data is insufficient; recommend clinician review for red flags. Be concise and precise. No hype. If the user explicitly asks to change plans, assess the five available families and propose at most one different plan. Never change it yourself: set plan_change_requested true so the app can ask the user to confirm.

ZERO-HALLUCINATION RULES: Never assert clinical claims not supported by the evidence grades in the Ingredient entity. For supplement dosing, always cite the evidence_grade. When uncertain, state uncertainty and recommend consulting a clinician. Never invent drug interactions, contraindications, or diagnostic conclusions.`,
    responseSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["chat", "analysis"] },
        chat_reply: { type: "string", description: "Conversational reply for small talk. Empty when mode is analysis." },
        observed: { type: "string", description: "What AQLA observed in the data" },
        explanation: { type: "string", description: "Most likely explanation" },
        confidence: { type: "string", enum: ["low", "moderate", "high"] },
        next_action: { type: "string" },
        safety_note: { type: "string", description: "Only if relevant, else empty string" },
        plan_change_requested: { type: "boolean" },
        recommended_family: { type: "string", enum: ["NONE", "SPARK", "FLOW", "DRIVE", "LEARN", "RESET"] },
        change_reason: { type: "string" },
      },
      required: ["mode", "observed", "explanation", "confidence", "next_action", "plan_change_requested", "recommended_family"],
    },
    timeoutMs: 30000,
    maxRetries: 2,
    clinicalRiskTier: "medium",
  },

  voice_checkin: {
    workerId: "voice_checkin",
    audience: "member",
    allowedRoles: ["user", "clinician", "admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "low",
    systemPrompt: `You are AQLA, an empathetic and clinically grounded daily check-in assistant.
Extract structured self-report metrics from the user's transcript and generate a supportive, concise 1-2 sentence response.
Never diagnose or advise on prescription medication.`,
    responseSchema: {
      type: "object",
      properties: {
        clarity: { type: "number", description: "Mental clarity score 1-10" },
        energy: { type: "number", description: "Physical/mental energy 1-10" },
        stress: { type: "number", description: "Subjective stress 1-10" },
        sleep_quality: { type: "number", description: "Sleep quality 1-10" },
        caffeine_drinks: { type: "string", description: "Caffeinated drinks mentioned" },
        caffeine_servings: { type: "number", description: "Estimated servings" },
        caffeine_last_time: { type: "string", description: "Approximate time of last caffeine intake" },
        side_effects: { type: "string", description: "Any side effects mentioned" },
        demand: { type: "string", description: "Cognitive/work demand description" },
        note: { type: "string", description: "Summary note of check-in" },
        reply: { type: "string", description: "Short supportive voice reply (1-2 sentences)" },
      },
      required: ["clarity", "energy", "stress", "sleep_quality", "reply"],
    },
    timeoutMs: 20000,
    maxRetries: 2,
    clinicalRiskTier: "medium",
  },

  weekly_summary: {
    workerId: "weekly_summary",
    audience: "member",
    allowedRoles: ["user", "clinician", "admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "medium",
    systemPrompt: `You are AQLA Intelligence writing an end-of-week summary for one user.
STRICT RULES: use ONLY the data provided. Never invent numbers, times, windows, trends or events. If a field cannot be supported by the data, return an empty string for it. State uncertainty when the sample is small. No diagnosis, no medication advice.`,
    responseSchema: {
      type: "object",
      properties: {
        headline: { type: "string" },
        observed: { type: "string" },
        pattern: { type: "string" },
        training: { type: "string" },
        next_week_focus: { type: "string" },
        confidence: { type: "string", enum: ["low", "moderate", "high"] },
      },
      required: ["headline", "observed", "next_week_focus", "confidence"],
    },
    timeoutMs: 30000,
    maxRetries: 2,
    clinicalRiskTier: "medium",
  },

  plan_review: {
    workerId: "plan_review",
    audience: "member",
    allowedRoles: ["user", "clinician", "admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "high",
    systemPrompt: `You are AQLA Intelligence reviewing a completed 14-check-in neural wellness plan. Analyze only the supplied data. Do not diagnose or advise on medication. Account for side effects conservatively. Decide whether to suggest continuing or switching among SPARK, FLOW, DRIVE, LEARN, RESET. A switch is only a suggestion; the user makes the final choice.`,
    responseSchema: {
      type: "object",
      properties: {
        observed_results: { type: "string" },
        summary: { type: "string" },
        reason: { type: "string" },
        should_switch: { type: "boolean" },
        recommended_family: { type: "string", enum: ["SPARK", "FLOW", "DRIVE", "LEARN", "RESET"] },
        confidence: { type: "string", enum: ["low", "moderate", "high"] },
      },
      required: ["observed_results", "summary", "reason", "should_switch", "recommended_family", "confidence"],
    },
    timeoutMs: 40000,
    maxRetries: 2,
    clinicalRiskTier: "high",
  },

  clinical_summary: {
    workerId: "clinical_summary",
    audience: "clinician",
    allowedRoles: ["clinician", "admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "high",
    systemPrompt: `You are an expert clinical neural-health analyst preparing a member summary for a reviewing clinician.
Synthesize cognitive domain scores, check-in trajectories, protocol adherence, and risk flags into an objective clinical brief.`,
    responseSchema: {
      type: "object",
      properties: {
        executive_summary: { type: "string" },
        cognitive_profile: { type: "string" },
        adherence_and_trend: { type: "string" },
        risk_flags: { type: "array", items: { type: "string" } },
        recommended_action: { type: "string" },
      },
      required: ["executive_summary", "cognitive_profile", "recommended_action"],
    },
    timeoutMs: 40000,
    maxRetries: 2,
    clinicalRiskTier: "high",
  },

  clinician_message_draft: {
    workerId: "clinician_message_draft",
    audience: "clinician",
    allowedRoles: ["clinician", "admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "medium",
    systemPrompt: `You are drafting a professional, compassionate communication from an AQLA clinician to a member.
Follow strict boundaries: warm tone, clear evidence rationale, no definitive off-platform medical diagnoses, 2-4 paragraphs.`,
    responseSchema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
        suggested_protocol: { type: "string" },
      },
      required: ["subject", "body"],
    },
    timeoutMs: 25000,
    maxRetries: 2,
    clinicalRiskTier: "medium",
  },

  clinical_followup_draft: {
    workerId: "clinical_followup_draft",
    audience: "clinician",
    allowedRoles: ["clinician", "admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "medium",
    systemPrompt: `You are drafting a short follow-up message from an AQLA clinician to a member, based on a flagged AI assistant message.
STRICT RULES:
- Only summarise what the assistant already said — never introduce new clinical claims, supplement dosing, or diagnoses.
- End with exactly one clarifying question.
- Keep it warm and human, 2-4 sentences.
- Do not claim the member has a condition.`,
    responseSchema: {
      type: "object",
      properties: { draft: { type: "string" } },
      required: ["draft"],
    },
    timeoutMs: 20000,
    maxRetries: 2,
    clinicalRiskTier: "medium",
  },

  complaint_query_interpreter: {
    workerId: "complaint_query_interpreter",
    audience: "admin",
    allowedRoles: ["admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "none",
    systemPrompt: `Extract key intent, categories, and search keywords from an admin complaint query for hybrid semantic + full-text search.`,
    responseSchema: {
      type: "object",
      properties: {
        keywords: { type: "array", items: { type: "string" } },
        category_filter: { type: "string" },
        status_filter: { type: "string" },
      },
      required: ["keywords"],
    },
    timeoutMs: 15000,
    maxRetries: 1,
    clinicalRiskTier: "low",
  },

  complaint_result_summary: {
    workerId: "complaint_result_summary",
    audience: "admin",
    allowedRoles: ["admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "none",
    systemPrompt: `Summarize retrieved user complaints strictly from the provided source records. Never invent or hallucinate complaints.`,
    responseSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        count: { type: "number" },
        common_themes: { type: "array", items: { type: "string" } },
      },
      required: ["summary", "count"],
    },
    timeoutMs: 20000,
    maxRetries: 1,
    clinicalRiskTier: "low",
  },

  idea_refinement: {
    workerId: "idea_refinement",
    audience: "admin",
    allowedRoles: ["admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "none",
    systemPrompt: `You are AQLA Architect's developer idea refinement engine. Structure raw feature ideas into actionable specifications.`,
    responseSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        detail: { type: "string" },
        tier: { type: "string", enum: ["big_idea", "feature", "improvement", "small_fix"] },
        impact: { type: "string" },
        effort: { type: "string" },
        steps: { type: "array", items: { type: "string" } },
      },
      required: ["title", "summary", "detail", "tier", "impact", "effort", "steps"],
    },
    timeoutMs: 20000,
    maxRetries: 1,
    clinicalRiskTier: "low",
  },

  wordbank_generation: {
    workerId: "wordbank_generation",
    audience: "admin",
    allowedRoles: ["admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "none",
    systemPrompt: `Generate 3 innovative product/engineering ideas around a given topic for the AQLA developer wordbank.`,
    responseSchema: {
      type: "object",
      properties: {
        ideas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              detail: { type: "string" },
              tier: { type: "string", enum: ["big_idea", "feature", "improvement", "small_fix"] },
              impact: { type: "string" },
              effort: { type: "string" },
              steps: { type: "array", items: { type: "string" } },
              area: { type: "string" },
            },
            required: ["title", "summary", "detail", "tier", "impact", "effort", "steps", "area"],
          },
        },
      },
      required: ["ideas"],
    },
    timeoutMs: 25000,
    maxRetries: 1,
    clinicalRiskTier: "low",
  },

  pdf_theme_assistant: {
    workerId: "pdf_theme_assistant",
    audience: "admin",
    allowedRoles: ["admin"],
    model: "gemini-3.6-flash",
    thinkingBudget: "none",
    systemPrompt: `Generate clean color and typography theme configurations for PDF report generation.`,
    responseSchema: {
      type: "object",
      properties: {
        theme_name: { type: "string" },
        config: {
          type: "object",
          properties: {
            primary_color: { type: "string" },
            accent_color: { type: "string" },
            bg_color: { type: "string" },
            font_family: { type: "string" },
          },
          required: ["primary_color", "accent_color", "bg_color"],
        },
        note: { type: "string" },
      },
      required: ["theme_name", "config"],
    },
    timeoutMs: 15000,
    maxRetries: 1,
    clinicalRiskTier: "low",
  },
};
