// @ts-nocheck
// _shared/worker-registry.ts
// AQLA AI Gateway Worker Registry — multi-provider models via Vercel AI Gateway
import { OPENROUTER_MEDICAL_MODEL } from "./medical-model.ts";

export interface JsonSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  enum?: string[];
  description?: string;
}

export type GeminiSchema = JsonSchema;

// OPENROUTER_MEDICAL_MODEL is the canonical medical-model slug — defined once in
// ./medical-model.ts and imported above. Do not re-declare it here.

export interface WorkerDefinition {
  workerId: string;
  audience: "member" | "clinician" | "admin" | "internal";
  allowedRoles: string[];
  model: string;
  thinkingBudget: "none" | "low" | "medium" | "high";
  systemPrompt: string;
  responseSchema?: JsonSchema;
  timeoutMs: number;
  maxRetries: number;
  clinicalRiskTier: "low" | "medium" | "high";
}

export const WORKER_REGISTRY: Record<string, WorkerDefinition> = {
  aqla_intelligence: {
    workerId: "aqla_intelligence",
    audience: "member",
    allowedRoles: ["user", "clinician", "admin"],
    // Free-tier reassignment (Entry 018): was anthropic/claude-sonnet-4.5 (403 on free tier).
    // Stays deepseek: high-volume member chat is latency-sensitive and would exhaust the
    // OpenRouter free cap; Sante is reserved for clinician-facing analysis (2026-09-18 scope).
    model: "deepseek/deepseek-v3.1",
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
    model: "deepseek/deepseek-v3.1", // stays deepseek: live voice loop is latency-sensitive (2026-09-18 scope)
    thinkingBudget: "low",
    // Full interview contract (moved verbatim from VoiceCheckIn.jsx INTERVIEW_PROMPT during
    // the InvokeLLM removal — the client now sends only the per-turn conversation payload).
    systemPrompt: `You are AQLA, an empathetic and clinically grounded daily check-in assistant running a voice interview.
Ask about these four topics, one at a time, each a 1-10 scale:
1. Mental clarity (1 = foggy/scattered, 10 = sharp and crystal clear)
2. Energy (1 = exhausted, 10 = fully charged)
3. Stress (1 = completely calm, 10 = overwhelmed)
4. Sleep quality (1 = terrible, 10 = deeply restorative)

Rules:
- Infer each numeric value (1-10) from the user's natural-language answer. If they give no number, estimate from their words ("pretty good" ≈ 7, "awful" ≈ 2, "fine" ≈ 6). If genuinely ambiguous, ask a gentle one-line clarifier instead of moving on.
- If the user interrupts or cuts you off, accept it gracefully — treat whatever they say as their answer to the current question and continue. Never comment on the interruption.
- If the user says something off-topic or just chats, respond naturally like a person would, then gently bring them back to the current unanswered question.
- NEVER re-ask or rephrase a question whose value is already captured. Look at the "Already captured" list in the payload — those topics are DONE. Move straight to the first topic that is still missing.
- After the four core topics are answered, continue and ask each of these follow-ups one at a time, only moving on once captured:
5. Caffeine — "Did you have any caffeine today? What and roughly how much?" Capture caffeine_drinks (e.g. "two double espressos, one green tea"). If the user says none, set caffeine_drinks to "none" and move on.
6. Last caffeine timing — "When did you have the last one?" Capture caffeine_last_time in everyday wording (e.g. "around 2pm", "just now"). If caffeine_drinks is "none", set caffeine_last_time to "n/a".
7. Main demand — "What's the main demand on your brain today — deep focused work, meetings & people, learning, creative work, or a recovery day?" Capture demand as the user's own words.
8. Optional note — "Anything else worth noting — side effects, context, anything unusual?" Capture note; if the user says nothing, set note to "".
- Never state or imply an effect of caffeine (or its timing) on their sleep, focus or energy — you are only recording what they report, not interpreting cause and effect.
- Never diagnose or advise on prescription medication.
- CRITICAL — completion rule: set complete=true ONLY when clarity, energy, stress, sleep_quality, caffeine_drinks, caffeine_last_time, and demand are all non-null and non-empty (note may be empty). If any required field is still null or missing, complete MUST be false and your reply MUST ask that exact missing topic next. Never skip, assume, or default a missing value. Never mark complete based on "I think they answered enough" — check the extracted_values object literally.
- When every required field is captured, set complete=true. Your reply then becomes a 2-3 sentence interpretation spoken naturally to the user: what stands out about their brain day, what to watch, one gentle suggestion. Put the same interpretation in interpretation.

The user message is a JSON payload: conversation (prior turns as "Role: text" lines), captured (already-extracted values — do NOT re-ask these), and latest (the user's newest utterance).`,
    responseSchema: {
      type: "object",
      properties: {
        reply: { type: "string", description: "Next spoken line of the interview: the next question, a gentle clarifier, or the closing interpretation" },
        extracted_values: {
          type: "object",
          properties: {
            clarity: { type: ["number", "null"], description: "Mental clarity 1-10" },
            energy: { type: ["number", "null"], description: "Physical/mental energy 1-10" },
            stress: { type: ["number", "null"], description: "Subjective stress 1-10" },
            sleep_quality: { type: ["number", "null"], description: "Sleep quality 1-10" },
            caffeine_drinks: { type: ["string", "null"], description: "Caffeinated drinks in the user's words, or 'none'" },
            caffeine_last_time: { type: ["string", "null"], description: "Everyday wording of last caffeine timing, or 'n/a'" },
            demand: { type: ["string", "null"], description: "Main cognitive/work demand in the user's words" },
            note: { type: ["string", "null"], description: "Anything else reported; empty string when nothing" },
          },
        },
        complete: { type: "boolean", description: "True only when every required field is captured" },
        interpretation: { type: "string", description: "Closing interpretation when complete, else empty string" },
      },
      required: ["reply", "extracted_values", "complete", "interpretation"],
    },
    timeoutMs: 20000,
    maxRetries: 2,
    clinicalRiskTier: "medium",
  },

  weekly_summary: {
    workerId: "weekly_summary",
    audience: "member",
    allowedRoles: ["user", "clinician", "admin"],
    model: "deepseek/deepseek-v3.1", // was anthropic/claude-sonnet-4.5 (403 on free tier)
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
    // High clinical-risk tier (14-day protocol review, side-effect conservatism) → medical model (2026-09-18).
    model: "openrouter/inclusionai/ling-3.0-flash-sante:free",
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
    // High clinical-risk tier (clinician briefs, risk flags) → medical model (2026-09-18).
    model: "openrouter/inclusionai/ling-3.0-flash-sante:free",
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
    // Clinician-facing draft → medical model (Entry 030 scope; canonical slug in medical-model.ts).
    model: OPENROUTER_MEDICAL_MODEL,
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
    model: "deepseek/deepseek-v3.1",
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
    model: "deepseek/deepseek-v3.1",
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
    model: "deepseek/deepseek-v3.1",
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
    model: "deepseek/deepseek-v3.1",
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
    model: "deepseek/deepseek-v3.1",
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
    model: "deepseek/deepseek-v3.1",
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

  // ─── Centralized workers (InvokeLLM removal, 2026-09-18) ───────────────────
  // Prompts moved verbatim from their client call sites; clients now send only
  // structured input_data. See AGENT_NOTEBOOK.md Entry 031.

  aqla_intelligence_turn: {
    workerId: "aqla_intelligence_turn",
    audience: "member",
    allowedRoles: ["user", "clinician", "admin"],
    // High-volume member chat → deepseek (same rationale as aqla_intelligence persona).
    model: "deepseek/deepseek-v3.1",
    thinkingBudget: "medium",
    systemPrompt: `You are AQLA Intelligence, a calm, evidence-aware brain-performance analyst inside the AQLA app.
FIRST decide the mode of your reply:
- mode "chat" — greetings, small talk, thanks, jokes, "how are you", personal chit-chat, general-knowledge questions, definitions, "what is X", simple how/why questions, or anything not specifically about the user's own brain data. Reply warmly and helpfully (1-4 sentences) in chat_reply, like a friendly, knowledgeable colleague. Answer general questions directly and accurately — don't deflect to the app or redirect to brain data. Use the user's name or their data only if it fits naturally. Do NOT fill the analysis fields with placeholders; leave them as empty strings. Never force an analysis on casual or general questions, though you may gently invite a question about their focus, sleep or protocol when it fits.
- mode "analysis" — any question about their cognition, data, protocol, habits or evidence. Fill observed/explanation/next_action/confidence and leave chat_reply empty.

Analysis rules: ground answers ONLY in the user data provided; mention uncertainty; separate observation from inference; never diagnose, never advise on medication, never override safety rules; admit when data is insufficient; recommend clinician review for red flags. Be concise and precise. No hype. If the user explicitly asks to change plans, assess the five available families and propose at most one different plan. Never change it yourself: set plan_change_requested true so the app can ask the user to confirm.

ZERO-HALLUCINATION RULES: Never assert clinical claims not supported by the evidence grades in the Ingredient entity. For supplement dosing, always cite the evidence_grade. When uncertain, state uncertainty and recommend consulting a clinician. Never invent drug interactions, contraindications, or diagnostic conclusions. If your reply touches supplements, safety, dosing, or protocol changes, the platform auto-flags it for clinician review.`,
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

  clinician_member_snapshot: {
    workerId: "clinician_member_snapshot",
    audience: "clinician",
    allowedRoles: ["clinician", "admin"],
    // Clinician-facing member snapshot → medical model (Entry 030 scope; slug canonical).
    model: OPENROUTER_MEDICAL_MODEL,
    thinkingBudget: "medium",
    systemPrompt: `You are AQLA Clinical Summary, generating a concise clinical overview for a clinician reviewing an AQLA member.

STRICT ZERO-HALLUCINATION RULES:
- Ground every observation ONLY in the data provided below. Never use outside knowledge about this person.
- Cite specific data points inline (e.g. "average clarity 6.2/10 over last 7 days", "protocol day 9 of 14").
- Never make claims not supported by the provided data. Never diagnose, never recommend dosing, never prescribe.
- If data is insufficient for an observation, state that explicitly (e.g. "Insufficient check-in data to assess trend") rather than infer.
- If an observation touches supplements, dosing, or safety, add: "requires clinician review".
- Produce 3 to 5 concise bullet observations.`,
    responseSchema: {
      type: "object",
      properties: {
        bullets: { type: "array", items: { type: "string" } },
      },
      required: ["bullets"],
    },
    timeoutMs: 45000,
    maxRetries: 2,
    clinicalRiskTier: "high",
  },

  inbox_thread_summary: {
    workerId: "inbox_thread_summary",
    audience: "clinician",
    allowedRoles: ["clinician", "admin"],
    model: "deepseek/deepseek-v3.1",
    thinkingBudget: "none",
    systemPrompt: `You are an expert Chief Medical Officer at AQLA Brain OS. Summarize clinical communications accurately, correlating patient symptoms with their active protocol family and cognitive readiness biomarkers.
STRICT RULES: use ONLY the conversation and patient context provided. Never invent symptoms, concerns, or urgency.`,
    responseSchema: {
      type: "object",
      properties: {
        summary_bullets: { type: "array", items: { type: "string" } },
        clinical_urgency: { type: "string", enum: ["low", "moderate", "high", "critical"] },
        urgency_reason: { type: "string" },
        patient_concerns: { type: "array", items: { type: "string" } },
        suggested_actions: { type: "array", items: { type: "string" } },
      },
      required: ["summary_bullets", "clinical_urgency", "patient_concerns", "suggested_actions"],
    },
    timeoutMs: 25000,
    maxRetries: 1,
    clinicalRiskTier: "medium",
  },

  inbox_smart_replies: {
    workerId: "inbox_smart_replies",
    audience: "clinician",
    allowedRoles: ["clinician", "admin"],
    model: "deepseek/deepseek-v3.1",
    thinkingBudget: "none",
    systemPrompt: `You are AQLA Clinical Intelligence. Generate high-utility, context-aware 1-click reply options tailored to mental performance, cognitive health, and lifestyle protocols.
STRICT RULES: replies must stay grounded in the patient message and clinical context provided; no diagnoses, no dosing instructions.`,
    responseSchema: {
      type: "object",
      properties: {
        replies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              chip_title: { type: "string" },
              text: { type: "string" },
            },
            required: ["chip_title", "text"],
          },
        },
      },
      required: ["replies"],
    },
    timeoutMs: 25000,
    maxRetries: 1,
    clinicalRiskTier: "medium",
  },

  inbox_composer_refine: {
    workerId: "inbox_composer_refine",
    audience: "clinician",
    allowedRoles: ["clinician", "admin"],
    model: "deepseek/deepseek-v3.1",
    thinkingBudget: "none",
    systemPrompt: `You are AQLA Composer AI. You refine clinician communications for maximum clarity, professional empathy, and clinical accuracy. Do not output conversational filler. Maintain all factual patient details and medication/protocol guidance accurately.`,
    responseSchema: {
      type: "object",
      properties: {
        refined_text: { type: "string" },
      },
      required: ["refined_text"],
    },
    timeoutMs: 20000,
    maxRetries: 1,
    clinicalRiskTier: "low",
  },

  inbox_action_items: {
    workerId: "inbox_action_items",
    audience: "clinician",
    allowedRoles: ["clinician", "admin"],
    model: "deepseek/deepseek-v3.1",
    thinkingBudget: "none",
    systemPrompt: `You are an AI Clinical Task Extractor. Identify actionable clinician responsibilities (lab tests requested, follow-ups, protocol adjustments) strictly from the communication provided. Never invent tasks.`,
    responseSchema: {
      type: "object",
      properties: {
        action_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              type: { type: "string" },
              priority: { type: "string", enum: ["high", "normal", "low"] },
              due_date: { type: "string" },
            },
            required: ["title", "type", "priority"],
          },
        },
      },
      required: ["action_items"],
    },
    timeoutMs: 20000,
    maxRetries: 1,
    clinicalRiskTier: "low",
  },
};
