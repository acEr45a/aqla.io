// @ts-nocheck
// _shared/gemini.ts
// AQLA Gemini API adapter for Supabase Edge Functions.
// All AI inference goes through here — never expose keys to the frontend.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiModel =
  | "gemini-2.5-flash"       // primary model (was gemini-3.7-flash in plan — use stable alias)
  | "gemini-2.0-flash-lite"  // utility/fast model
  | "text-embedding-004";    // embeddings (768d)

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  items?: unknown;
  enum?: string[];
  description?: string;
}

export interface GeminiGenerateOptions {
  model: GeminiModel;
  systemInstruction?: string;
  contents: GeminiContent[];
  responseJsonSchema?: GeminiSchema;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: "none" | "low" | "medium" | "high";
  correlationId?: string;
}

export interface GeminiGenerateResult {
  text: string;
  parsed?: unknown;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

// Map thinking budget labels to token counts
const THINKING_BUDGETS: Record<string, number> = {
  none: 0,
  low: 1024,
  medium: 8192,
  high: 24576,
};

export async function geminiGenerate(
  apiKey: string,
  opts: GeminiGenerateOptions,
): Promise<GeminiGenerateResult> {
  const {
    model,
    systemInstruction,
    contents,
    responseJsonSchema,
    temperature = 1.0,
    maxOutputTokens = 8192,
    thinkingBudget = "none",
  } = opts;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(responseJsonSchema
        ? {
            responseMimeType: "application/json",
            responseSchema: responseJsonSchema,
          }
        : {}),
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  // Thinking budget (only supported on Gemini 2.5+ models)
  if (thinkingBudget !== "none" && model.startsWith("gemini-2.5")) {
    (body.generationConfig as Record<string, unknown>).thinkingConfig = {
      thinkingBudget: THINKING_BUDGETS[thinkingBudget] ?? 0,
    };
  }

  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(`Gemini API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error("Gemini returned no candidates");

  const rawText: string =
    candidate.content?.parts?.map((p: GeminiPart) => p.text).join("") ?? "";

  const inputTokens: number = data.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens: number = data.usageMetadata?.candidatesTokenCount ?? 0;

  let parsed: unknown = undefined;
  if (responseJsonSchema) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${rawText.slice(0, 200)}`);
    }
  }

  return { text: rawText, parsed, inputTokens, outputTokens, model };
}

// Validate parsed output against required fields in the schema
export function validateSchema(
  parsed: unknown,
  schema: GeminiSchema,
): string | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "Response is not an object";
  }
  const obj = parsed as Record<string, unknown>;
  for (const field of schema.required ?? []) {
    if (!(field in obj)) return `Missing required field: ${field}`;
  }
  return null; // valid
}
