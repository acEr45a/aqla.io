// @ts-nocheck
// _shared/gemini.ts
// AQLA Gemini API adapter for Supabase Edge Functions.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiModel =
  | "gemini-3.6-flash"
  | "gemini-flash-latest"
  | "gemini-3.7-flash"
  | "gemini-2.5-flash-lite";

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
  model?: string;
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

export async function geminiGenerate(
  apiKey: string,
  opts: GeminiGenerateOptions,
): Promise<GeminiGenerateResult> {
  const {
    model = "gemini-3.6-flash",
    systemInstruction,
    contents,
    responseJsonSchema,
    temperature = 0.7,
    maxOutputTokens = 8192,
  } = opts;

  const modelsToTry = [
    model,
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-2.5-flash-lite",
  ];

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

  let lastError: Error | null = null;

  for (const m of Array.from(new Set(modelsToTry))) {
    try {
      const cleanModel = m.replace(/^models\//, "");
      const url = `${GEMINI_BASE}/${cleanModel}:generateContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => resp.statusText);
        throw new Error(`Gemini API error ${resp.status} on ${cleanModel}: ${errText}`);
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
          parsed = { text: rawText };
        }
      }

      return { text: rawText, parsed, inputTokens, outputTokens, model: cleanModel };
    } catch (err: any) {
      lastError = err;
      console.warn(`[geminiGenerate] Failed on ${m}:`, err.message);
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

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
  return null;
}
