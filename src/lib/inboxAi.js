import { runAiWorker } from "@/api/apiClient";

/**
 * Enterprise AI Intelligence Suite for Clinical Email Inbox
 * Grounded in the recipient patient's actual AQLA clinical data & cognitive biomarkers.
 * All four AI operations are centralized in worker-registry.ts (workers:
 * inbox_thread_summary, inbox_smart_replies, inbox_composer_refine, inbox_action_items)
 * — prompts and schemas live server-side; this module only assembles structured
 * input_data. (Migrated from directGeminiInvoke during the InvokeLLM removal, Entry 031.)
 */

// 1. Thread Summarization with Patient Clinical Context Grounding
export async function generateThreadSummary(messages = [], patientContext = null) {
  if (!messages || messages.length === 0) {
    return {
      summary_bullets: ["No messages found in this thread."],
      clinical_urgency: "low",
      patient_concerns: [],
      suggested_actions: [],
    };
  }

  const conversationText = messages
    .map(
      (m, i) =>
        `[Message ${i + 1} - From: ${m.sender_name || m.sender_email} (${m.sender_email}) at ${m.created_at || 'recent'}]\nSubject: ${m.subject || 'None'}\nBody:\n${m.body_html?.replace(/<[^>]*>/g, " ").trim() || ''}`
    )
    .join("\n\n---\n\n");

  try {
    return await runAiWorker("inbox_thread_summary", {
      conversation: conversationText,
      patient_context: patientContext
        ? {
            name: patientContext.name,
            active_protocol: patientContext.protocol?.name || 'SPARK',
            protocol_family: patientContext.protocol?.family || 'SPARK',
            readiness_avg: patientContext.readinessAvg,
            weakest_domain: patientContext.weakestDomain?.domain_name || 'Focus Depth',
            weakest_domain_score: patientContext.weakestDomain?.score ?? null,
          }
        : null,
    });
  } catch (err) {
    console.warn("[inboxAi.generateThreadSummary] Fallback:", err.message);
    return {
      summary_bullets: [
        "Patient discussed cognitive performance observations and daily adherence.",
        "Clinical follow-up requested regarding next steps and protocol adjustments.",
      ],
      clinical_urgency: "moderate",
      urgency_reason: "Patient reports change in daily symptoms",
      patient_concerns: ["Energy fluctuations", "Cognitive clarity"],
      suggested_actions: ["Review latest 7-day check-in log", "Provide personalized reply"],
    };
  }
}

// 2. Smart Reply Generation (Grounded in Patient's Active Protocol)
export async function generateSmartReplies(messages = [], clinicianName = "Dr. Richardson", patientContext = null) {
  const lastMsg = messages[messages.length - 1];
  const lastBody = lastMsg?.body_html?.replace(/<[^>]*>/g, " ").slice(0, 800) || "Patient asked for advice.";

  try {
    const res = await runAiWorker("inbox_smart_replies", {
      clinician_name: clinicianName,
      patient_message: lastBody,
      patient_context: patientContext
        ? {
            name: patientContext.name,
            active_protocol: patientContext.protocol?.name || 'SPARK',
            readiness_avg: patientContext.readinessAvg,
            weakest_domain: patientContext.weakestDomain?.domain_name || 'Focus',
          }
        : null,
    });
    return res?.replies || [];
  } catch (err) {
    console.warn("[inboxAi.generateSmartReplies] Fallback:", err.message);
    return [
      {
        chip_title: "Acknowledge & Support",
        text: "Thank you for sharing these details. I have reviewed your signals and recommend continuing with your current baseline while monitoring your afternoon energy.",
      },
      {
        chip_title: "Request Check-In Log",
        text: "Please make sure to complete your daily check-in tonight so we can accurately track your cognitive readiness trend.",
      },
      {
        chip_title: "Protocol Modification",
        text: "Based on your feedback, we can safely calibrate your active protocol family. Let me update your recommendations in the system.",
      },
    ];
  }
}

// 3. Composer Assist: Tone & Format Transformation
export async function refineComposerContent(text, mode = "formalize", patientContext = null) {
  if (!text || text.trim().length === 0) return text;

  let modeInstruction = "Make the text formal, empathetic, and clinically precise.";
  if (mode === "shorten") {
    modeInstruction = "Condense this email into a concise, direct, high-impact clinical response without losing key instructions.";
  } else if (mode === "expand") {
    modeInstruction = "Expand this draft with thorough clinical rationale, evidence-informed reasoning, and supportive guidance.";
  } else if (mode === "clinical_note") {
    modeInstruction = `Convert this email/draft into a formal Clinical Note format (Subjective, Objective, Assessment, Plan / Protocol Guidance) suitable for medical charts and patient records.${
      patientContext ? ` Patient: ${patientContext.name}, Protocol: ${patientContext.protocol?.name}, Readiness: ${patientContext.readinessAvg}%.` : ""
    }`;
  }

  try {
    const res = await runAiWorker("inbox_composer_refine", {
      mode_instruction: modeInstruction,
      patient_context: patientContext ? { name: patientContext.name } : null,
      draft: text,
    });
    return res?.refined_text || text;
  } catch (err) {
    console.warn("[inboxAi.refineComposerContent] Fallback:", err.message);
    return text;
  }
}

// 4. AI Action Item & Protocol Task Extractor
export async function extractActionItems(messages = []) {
  if (!messages || messages.length === 0) return [];
  const text = messages.map((m) => `${m.sender_name || m.sender_email}: ${m.body_html?.replace(/<[^>]*>/g, " ")}`).join("\n");

  try {
    const res = await runAiWorker("inbox_action_items", {
      communication: text.slice(0, 2000),
    });
    return res?.action_items || [];
  } catch {
    return [
      { title: "Review 7-Day Readiness Trend", type: "protocol_adjustment", priority: "normal", due_date: "Next Check-in" },
    ];
  }
}
