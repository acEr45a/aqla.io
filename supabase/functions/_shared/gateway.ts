// @ts-nocheck
// supabase/functions/_shared/gateway.ts
// Unified AI Gateway Client for Vercel AI Gateway & Gemini with Function Calling

import { ToolDefinition } from "./tools-catalog.ts";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

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

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${gatewayKey}`,
    },
    body: JSON.stringify(payload),
  });

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
