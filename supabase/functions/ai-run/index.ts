// @ts-nocheck
// supabase/functions/ai-run/index.ts
// AQLA AI Gateway Edge Function
// Handles all worker execution requests, routing them securely to Gemini.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiGenerate, validateSchema } from "../_shared/gemini.ts";
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
        model: "gemini-3.6-flash",
        thinkingBudget: "medium",
        systemPrompt: "",
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

    modelName = worker.model;

    // 3. Role-based authorization
    if (worker.audience !== "member" && !worker.allowedRoles.includes(userRole)) {
      return new Response(
        JSON.stringify({ error: `Unauthorized: worker requires role ${worker.allowedRoles.join(" or ")}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Server error: GEMINI_API_KEY is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Build prompt content
    const promptText = customPrompt || (inputData ? JSON.stringify(inputData) : "");
    const contents = [{ role: "user" as const, parts: [{ text: promptText }] }];
    const schemaToUse = customSchema || worker.responseSchema;

    // 5. Execute Gemini Inference
    const result = await geminiGenerate(geminiApiKey, {
      model: worker.model,
      systemInstruction: worker.systemPrompt,
      contents,
      responseJsonSchema: schemaToUse,
      thinkingBudget: worker.thinkingBudget,
      correlationId,
    });

    const latencyMs = Date.now() - startTime;

    // 6. Schema validation if required
    if (schemaToUse && result.parsed) {
      const validationErr = validateSchema(result.parsed, schemaToUse);
      if (validationErr) {
        console.warn(`[ai-run] Schema warning for ${workerId}: ${validationErr}`);
      }
    }

    // 7. Audit log in ai_runs table (non-blocking)
    try {
      await adminClient.from("ai_runs").insert({
        user_id: userId,
        worker_id: workerId,
        model: result.model,
        prompt_version: "v1-imported-base44",
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        latency_ms: latencyMs,
        status: "success",
        correlation_id: correlationId,
      });
    } catch (dbErr) {
      console.error("[ai-run] Failed to write ai_runs log:", dbErr);
    }

    // 8. Return response
    const output = result.parsed !== undefined ? result.parsed : { text: result.text };
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
