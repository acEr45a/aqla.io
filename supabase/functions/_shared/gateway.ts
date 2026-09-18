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
// Note: OpenRouter models ("openrouter/" prefix) are deliberately NOT in this chain — they are
// assigned directly to specific medical workers; if a request for one fails 403/429 it failovers
// onto this Vercel AI Gateway chain, never the reverse.
export const FREE_TIER_MODEL_CHAIN = [
  "deepseek/deepseek-v3.1",
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
  "anthropic/claude-3-haiku",
];

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface GatewayRoute {
  url: string;
  model: string;
  isOpenRouter: boolean;
}

// Models prefixed "openrouter/" route to openrouter.ai (own API key); everything else
// keeps the Vercel AI Gateway endpoint and its key resolution.
function resolveGatewayRoute(model: string): GatewayRoute {
  if (model.startsWith("openrouter/")) {
    return {
      url: OPENROUTER_URL,
      model: model.slice("openrouter/".length),
      isOpenRouter: true,
    };
  }
  return { url: GATEWAY_URL, model, isOpenRouter: false };
}

// Key resolution happens per attempt because the fallback chain can mix providers
// (e.g. an OpenRouter medical model failing over onto the Vercel AI Gateway chain).
function resolveGatewayKey(explicitKey: string, isOpenRouter: boolean): string {
  if (explicitKey) return explicitKey;
  const envNames = isOpenRouter
    ? ["OPENROUTER_API_KEY", "OPENROUTER_KEY"]
    : ["VERCEL_AI_GATEWAY_KEY", "VERCEL_AI_GATEWAY_TOKEN", "AI_GATEWAY_KEY", "AI_GATEWAY_API_KEY"];
  for (const name of envNames) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  return "";
}

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
// Additionally, a 200 that carries ONLY reasoning tokens (content null/empty and no
// tool calls — observed on reasoning models like Ling Sante when the token budget is
// exhausted) is treated as a failed attempt and failover proceeds.
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

    const route = resolveGatewayRoute(attemptModel);
    const attemptKey = resolveGatewayKey(gatewayKey, route.isOpenRouter);
    if (route.isOpenRouter && !attemptKey) {
      // No OpenRouter credential configured — skip OR models instead of surfacing a 401
      // mid-chain; the next attempt is a regular Vercel AI Gateway model.
      console.warn(`[gateway] no OPENROUTER_API_KEY set; skipping ${attemptModel}`);
      continue;
    }

    const response = await fetch(route.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${attemptKey}`,
        ...(route.isOpenRouter
          ? { "HTTP-Referer": "https://aqla.io", "X-Title": "AQLA" }
          : {}),
      },
      body: JSON.stringify({ ...payload, model: route.model }),
    });

    if (response.ok) {
      // Peek (via clone so the caller can still consume the original body) to detect
      // reasoning-only responses with no usable output.
      try {
        const data = await response.clone().json();
        const message = data?.choices?.[0]?.message;
        const hasOutput =
          (typeof message?.content === "string" && message.content.trim().length > 0) ||
          (Array.isArray(message?.tool_calls) && message.tool_calls.length > 0);
        if (!hasOutput && i < attemptModels.length - 1) {
          console.warn(
            `[gateway] reasoning-only (null content) response on ${attemptModel}; failing over to ${attemptModels[i + 1]}`
          );
          lastResponse = response;
          continue;
        }
      } catch {
        // Non-JSON 200 body — hand it to the caller unchanged.
      }
      return response;
    }

    const retryableStatus = response.status === 403 || response.status === 429;
    if (!retryableStatus || i === attemptModels.length - 1) {
      return response;
    }
    lastResponse = response;
    console.warn(
      `[gateway] ${response.status} on ${attemptModel}; failing over to ${attemptModels[i + 1]}`
    );
  }

  if (lastResponse) return lastResponse;
  // Every attempt was skipped (e.g. no OpenRouter key) — synthesize a 503 so callers
  // get a normal error path instead of a null response.
  return new Response(
    JSON.stringify({ error: { message: "No AI provider available: requested model skipped and no OPENROUTER_API_KEY configured." } }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
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
    // Explicit key wins; env keys resolve per-attempt in fetchWithModelFallback
    // because the fallback chain can mix Vercel AI Gateway and OpenRouter models.
    gatewayKey = opts.gatewayKey || "",
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
