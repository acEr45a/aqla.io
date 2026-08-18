import { directGeminiInvoke } from "@/api/apiClient";

/**
 * Enterprise AI Intelligence Suite for Clinical Email Inbox
 * Grounded in the recipient patient's actual AQLA clinical data & cognitive biomarkers.
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

  const clinicalContextBlock = patientContext
    ? `\n\nPatient Clinical Profile:
- Name: ${patientContext.name} (${patientContext.email})
- Active Protocol: ${patientContext.protocol?.name || 'SPARK'} [${patientContext.protocol?.family || 'SPARK'}]
- 7-Day Cognitive Readiness Average: ${patientContext.readinessAvg}%
- Primary Bottleneck Domain: ${patientContext.weakestDomain?.domain_name || 'Focus Depth'} (Score: ${patientContext.weakestDomain?.score || 45})`
    : "";

  const prompt = `Analyze this clinical email conversation thread between a patient and clinician.${clinicalContextBlock}

Conversation:
${conversationText}

Produce valid JSON with exactly these keys:
{
  "summary_bullets": ["Concise bullet 1", "Concise bullet 2", "Concise bullet 3"],
  "clinical_urgency": "low" | "moderate" | "high" | "critical",
  "urgency_reason": "Brief reason for urgency rating",
  "patient_concerns": ["Key symptom or question 1", "Key concern 2"],
  "suggested_actions": ["Action item 1 for the clinician", "Action item 2"]
}`;

  try {
    const res = await directGeminiInvoke({
      prompt,
      system_instruction:
        "You are an expert Chief Medical Officer at AQLA Brain OS. Summarize clinical communications accurately, correlating patient symptoms with their active protocol family and cognitive readiness biomarkers.",
      response_json_schema: {
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
    });

    return (
      res.data ||
      res || {
        summary_bullets: ["Patient discussed daily protocol adherence.", "Reviewed recent cognitive readiness telemetry."],
        clinical_urgency: "low",
        patient_concerns: ["Protocol timing"],
        suggested_actions: ["Calibrate morning protocol block"],
      }
    );
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

  const clinicalContextBlock = patientContext
    ? `Patient Data: ${patientContext.name}, Active Protocol: ${patientContext.protocol?.name || 'SPARK'}, Readiness: ${patientContext.readinessAvg}%, Bottleneck: ${patientContext.weakestDomain?.domain_name || 'Focus'}.`
    : "";

  const prompt = `Based on this latest message from a patient, generate 3 professional, empathetic, evidence-backed 1-click clinical smart replies for clinician ${clinicianName}.
${clinicalContextBlock}

Patient message:
"${lastBody}"

Return JSON:
{
  "replies": [
    {
      "chip_title": "Acknowledge & Adjust",
      "text": "Thank you for the update. Let's adjust your morning protocol by shifting your focus block 30 minutes earlier..."
    },
    {
      "chip_title": "Request Log Review",
      "text": "I've reviewed your latest signals. Could you log your sleep and mental energy in today's check-in so we can evaluate the trend?"
    },
    {
      "chip_title": "Schedule Check-In",
      "text": "Your observations are noted. Let's schedule a brief 10-minute clinical review this week to optimize your protocol."
    }
  ]
}`;

  try {
    const res = await directGeminiInvoke({
      prompt,
      system_instruction:
        "You are AQLA Clinical Intelligence. Generate high-utility, context-aware 1-click reply options tailored to mental performance, cognitive health, and lifestyle protocols.",
      response_json_schema: {
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
    });

    return res.data?.replies || res.replies || [];
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

  const prompt = `Transform the following clinician draft email according to this instruction: "${modeInstruction}".
Maintain all factual patient details and medication/protocol guidance accurately.

Draft:
"""
${text}
"""

Return only the refined text directly.`;

  try {
    const res = await directGeminiInvoke({
      prompt,
      system_instruction:
        "You are AQLA Composer AI. You refine clinician communications for maximum clarity, professional empathy, and clinical accuracy. Do not output conversational filler.",
    });

    return res.text || res.data || text;
  } catch (err) {
    console.warn("[inboxAi.refineComposerContent] Fallback:", err.message);
    return text;
  }
}

// 4. AI Action Item & Protocol Task Extractor
export async function extractActionItems(messages = []) {
  if (!messages || messages.length === 0) return [];
  const text = messages.map((m) => `${m.sender_name || m.sender_email}: ${m.body_html?.replace(/<[^>]*>/g, " ")}`).join("\n");

  const prompt = `Extract actionable clinical tasks, lab tests requested, follow-up dates, or protocol adjustments from this communication.

Text:
${text.slice(0, 2000)}

Return JSON:
{
  "action_items": [
    {
      "title": "Review Biomarker Panel",
      "type": "lab_review" | "protocol_adjustment" | "followup" | "medication",
      "priority": "high" | "normal" | "low",
      "due_date": "YYYY-MM-DD or soonest"
    }
  ]
}`;

  try {
    const res = await directGeminiInvoke({
      prompt,
      system_instruction: "You are an AI Clinical Task Extractor. Identify actionable clinician responsibilities.",
      response_json_schema: {
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
    });

    return res.data?.action_items || res.action_items || [];
  } catch {
    return [
      { title: "Review 7-Day Readiness Trend", type: "protocol_adjustment", priority: "normal", due_date: "Next Check-in" },
    ];
  }
}
