// @ts-nocheck
// supabase/functions/ai-run/index.ts
// AQLA AI Gateway Edge Function
// Handles all worker execution requests, routing them securely to Gemini.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiGenerate, validateSchema } from "../_shared/gemini.ts";
import { callAiGateway } from "../_shared/gateway.ts";
import { WORKER_REGISTRY } from "../_shared/worker-registry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  let workerId = "unknown";
  let userId: string | null = null;
  let modelName = "gemini-3.6-flash";
  const correlationId = crypto.randomUUID();

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Authenticate user from JWT
    const authHeader = req.headers.get("Authorization");
    let userRole = "user";

    if (authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        userId = user.id;
        // Fetch role from profiles
        const { data: profile } = await adminClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        userRole = profile?.role || "user";
      }
    }

    // 2. Parse request payload
    const body = await req.json();
    workerId = body.worker_id || body.workerId || "custom_prompt";
    const customPrompt = body.prompt;
    const customSchema = body.response_json_schema || body.responseJsonSchema;
    const inputData = body.input_data || body.inputData;

    let worker = WORKER_REGISTRY[workerId];

    // Support dynamic / legacy InvokeLLM calls with inline prompt & schema
    if (!worker && customPrompt) {
      worker = {
        workerId: "dynamic_worker",
        audience: "member",
        allowedRoles: ["user", "clinician", "admin"],
        model: body.model || "deepseek/deepseek-v3.1",
        thinkingBudget: "medium",
        systemPrompt: body.system_instruction || "",
        responseSchema: customSchema,
        timeoutMs: 30000,
        maxRetries: 1,
        clinicalRiskTier: "medium",
      };
    }

    if (!worker) {
      return new Response(
        JSON.stringify({ error: `Worker '${workerId}' not found in registry.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    modelName = body.model || worker.model;

    // 3. Authorization: every worker requires an authenticated caller; allowedRoles
    // then gates which authenticated roles may use this specific worker.
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!worker.allowedRoles.includes(userRole)) {
      return new Response(
        JSON.stringify({ error: `Unauthorized: worker requires role ${worker.allowedRoles.join(" or ")}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Build prompt content
    const promptText = customPrompt || (inputData ? JSON.stringify(inputData) : "");
    const contents = [{ role: "user" as const, parts: [{ text: promptText }] }];
    const schemaToUse = customSchema || worker.responseSchema;

    // 5. Dual-Track Execution: Vercel AI Gateway for multi-provider models, Gemini for native Google
    let resultText = "";
    let parsedResult: any = undefined;
    let inputTokens = 0;
    let outputTokens = 0;
    let executedModel = modelName;

    const isGatewayModel = modelName.includes("/") && !modelName.startsWith("models/");

    if (isGatewayModel) {
      const messages = [
        ...(worker.systemPrompt ? [{ role: "system" as const, content: worker.systemPrompt }] : []),
        { role: "user" as const, content: promptText },
      ];

      const gwResp = await callAiGateway({
        model: modelName,
        messages,
        reasoningBudget: worker.thinkingBudget || "none",
      });

      resultText = gwResp.content || "";
      inputTokens = gwResp.inputTokens;
      outputTokens = gwResp.outputTokens;
      executedModel = gwResp.model;

      if (schemaToUse) {
        try {
          parsedResult = JSON.parse(resultText);
        } catch {
          parsedResult = { text: resultText };
        }
      }
    } else {
      if (!geminiApiKey) {
        return new Response(
          JSON.stringify({ error: "Server error: GEMINI_API_KEY is not configured." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const result = await geminiGenerate(geminiApiKey, {
        model: modelName,
        systemInstruction: worker.systemPrompt,
        contents,
        responseJsonSchema: schemaToUse,
        thinkingBudget: worker.thinkingBudget,
        correlationId,
      });

      resultText = result.text;
      parsedResult = result.parsed;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
      executedModel = result.model;
    }

    const latencyMs = Date.now() - startTime;

    // 6. Schema validation if required
    if (schemaToUse && parsedResult) {
      const validationErr = validateSchema(parsedResult, schemaToUse);
      if (validationErr) {
        console.warn(`[ai-run] Schema warning for ${workerId}: ${validationErr}`);
      }
    }

    // 7. Audit log in ai_runs table (non-blocking)
    try {
      await adminClient.from("ai_runs").insert({
        user_id: userId,
        worker_id: workerId,
        model: executedModel,
        prompt_version: "v1-imported-base44",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        latency_ms: latencyMs,
        status: "success",
        correlation_id: correlationId,
      });
    } catch (dbErr) {
      console.error("[ai-run] Failed to write ai_runs log:", dbErr);
    }

    // 8. Return response
    const output = parsedResult !== undefined ? parsedResult : { text: resultText };
    return new Response(
      JSON.stringify(output),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error(`[ai-run] Execution failure for worker ${workerId}:`, error);

    try {
      await adminClient.from("ai_runs").insert({
        user_id: userId,
        worker_id: workerId,
        model: modelName,
        latency_ms: latencyMs,
        status: "error",
        error_message: error.message || String(error),
        correlation_id: correlationId,
      });
    } catch { /* ignore secondary log failures */ }

    return new Response(
      JSON.stringify({ error: error.message || "AI Gateway execution error", correlation_id: correlationId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
