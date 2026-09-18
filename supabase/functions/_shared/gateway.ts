// @ts-nocheck
// supabase/functions/_shared/gateway.ts
// Unified AI Gateway Client for Vercel AI Gateway & Gemini with Function Calling

import { ToolDefinition } from "./tools-catalog.ts";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

// Free-tier-aware fallback chain (verified 2026-09-18 via scripts/probe-free-tier-models.mjs):
// the free tier excludes flagship models (403: claude-sonnet-4.5, deepseek-v3.2/v4, gpt-5-pro, ...)
// and globally burst-throttles everything else (429). Chain is ordered by default-tier preference:
// deepseek first (the long-standing default), then fast/cheap minis across providers so a 429 on
// one provider can be absorbed by another.
export const FREE_TIER_MODEL_CHAIN = [
  "deepseek/deepseek-v3.1",
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
  "anthropic/claude-3-haiku",
];

export interface GatewayMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export interface GatewayRequestOptions {
  model: string;
  messages: GatewayMessage[];
  tools?: ToolDefinition[];
  reasoningBudget?: "none" | "low" | "medium" | "high";
  temperature?: number;
  maxTokens?: number;
  gatewayKey?: string;
}

export interface GatewayResponse {
  content: string | null;
  toolCalls?: {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }[];
  inputTokens: number;
  outputTokens: number;
  model: string;
}

// Attempts the requested model; on 403 (model not in tier) or 429 (rate-limited)
// walks FREE_TIER_MODEL_CHAIN. Other statuses (400/5xx) throw immediately — a 400
// is a payload bug and retrying it on another model just burns quota.
async function fetchWithModelFallback(
  model: string,
  payload: Record<string, any>,
  gatewayKey: string
): Promise<Response> {
  const attemptModels = [
    model,
    ...FREE_TIER_MODEL_CHAIN.filter((m) => m !== model),
  ];
  let lastResponse: Response | null = null;

  for (let i = 0; i < attemptModels.length; i++) {
    const attemptModel = attemptModels[i];
    if (i > 0) {
      // Brief backoff before failover; free-tier 429s are short-window bursts.
      await new Promise((r) => setTimeout(r, 2000));
    }
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify({ ...payload, model: attemptModel }),
    });

    if (response.ok) return response;

    const retryableStatus = response.status === 403 || response.status === 429;
    if (!retryableStatus || i === attemptModels.length - 1) {
      return response;
    }
    lastResponse = response;
    console.warn(
      `[gateway] ${response.status} on ${attemptModel}; failing over to ${attemptModels[i + 1]}`
    );
  }

  return lastResponse!;
}

export async function callAiGateway(
  opts: GatewayRequestOptions
): Promise<GatewayResponse> {
  const {
    model = "deepseek/deepseek-v3.1",
    messages,
    tools = [],
    reasoningBudget = "none",
    temperature = 0.7,
    maxTokens = 4096,
    gatewayKey = opts.gatewayKey ||
      Deno.env.get("VERCEL_AI_GATEWAY_KEY") ||
      Deno.env.get("VERCEL_AI_GATEWAY_TOKEN") ||
      Deno.env.get("AI_GATEWAY_KEY") ||
      Deno.env.get("AI_GATEWAY_API_KEY") ||
      "",
  } = opts;

  // Format tools for OpenAI-compatible schema
  const formattedTools = tools.length > 0
    ? tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: "object",
            properties: Object.fromEntries(
              Object.entries(t.parameters.properties).map(([k, v]) => [
                k,
                {
                  type: (v.type || "string").toLowerCase(),
                  description: v.description,
                  ...(v.enum ? { enum: v.enum } : {}),
                },
              ])
            ),
            required: t.parameters.required || [],
          },
        },
      }))
    : undefined;

  const payload: Record<string, any> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (formattedTools && formattedTools.length > 0) {
    payload.tools = formattedTools;
    payload.tool_choice = "auto";
  }

  // Pass reasoning parameters if supported or configured
  if (reasoningBudget && reasoningBudget !== "none") {
    payload.reasoning = { effort: reasoningBudget };
  }

  const response = await fetchWithModelFallback(
    model,
    payload,
    gatewayKey
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(
      `AI Gateway error ${response.status} on model ${model}: ${errText}`
    );
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  return {
    content: message?.content || null,
    toolCalls: message?.tool_calls || undefined,
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
    model: data.model || model,
  };
}
