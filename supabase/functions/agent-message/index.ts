// @ts-nocheck
// supabase/functions/agent-message/index.ts
// AQLA Agent Runtime Edge Function
// Drives Backend Ops (Operations & Architect), Help Agent, and Intelligence Coach
// Equipped with Multi-Step Tool Calling (up to 5 turns), Vector RAG, and Safety Confirmation Gates.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAiGateway, GatewayMessage } from "../_shared/gateway.ts";
import { getToolsForAgent } from "../_shared/tools-catalog.ts";
import { executeAgentTool } from "../_shared/tool-executor.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_CONFIGS: Record<string, {
  defaultModel: string;
  defaultReasoning: "none" | "low" | "medium" | "high";
  systemPrompt: string;
}> = {
  help_agent: {
    defaultModel: "deepseek/deepseek-v3.1",
    defaultReasoning: "none",
    systemPrompt: `You are the AQLA Help Assistant.
Your purpose is to answer member questions clearly, warmly, and accurately regarding:
- Their Brain Map, cognitive tests, daily check-ins, and active protocols
- How platform features and tools work
- Evidence-based lifestyle and cognitive habits

CRITICAL RAG & TOOL RULES:
- Always use the search_knowledge_base tool to verify facts, guides, and platform rules.
- If search_knowledge_base returns NO matching internal documents or low similarity, STRICTLY state that no verified platform guide exists and offer to create a support ticket. Do NOT hallucinate platform procedures.
- Never diagnose medical conditions or recommend prescription drug dosages.`,
  },

  aqla_intelligence: {
    defaultModel: "anthropic/claude-sonnet-4.5",
    defaultReasoning: "medium",
    systemPrompt: `You are the AQLA Intelligence Coach, a world-class cognitive performance and neuroplasticity analyst.
You help members optimize their brain metrics, interpret cognitive test baselines, and adhere to personalized protocols.

CRITICAL RAG & TOOL RULES:
- Use search_knowledge_base to retrieve evidence-graded protocols (NSDR, Dual N-Back, etc.) and get_member_brain_metrics to reference their actual scores.
- If no internal protocol is found in the knowledge base, you may provide established general cognitive neuroscience advice, but you MUST include an explicit disclaimer stating that this is general neuroscience guidance and not a customized AQLA protocol.
- Always maintain an empathetic, motivating, and clinically responsible tone.`,
  },

  backend_ops_operations: {
    defaultModel: "anthropic/claude-sonnet-4.5",
    defaultReasoning: "high",
    systemPrompt: `You are AQLA Backend Ops in OPERATIONS mode.
You assist platform administrators and engineers with:
- System diagnostics, database telemetry, service metrics, and error rates (use get_system_health)
- Identifying stuck user onboarding flows or missing check-in streaks (use inspect_user_flow)
- Email delivery status, bounce logs, and re-triggering notifications (use get_email_delivery_status, retrigger_email)
- Resetting onboarding states for blocked users (use reset_onboarding_step)

Be concise, technical, precise, and objective. Ground all suggestions in live data.`,
  },

  backend_ops_architect: {
    defaultModel: "anthropic/claude-sonnet-4.5",
    defaultReasoning: "high",
    systemPrompt: `You are AQLA Backend Ops in ARCHITECT mode.
You assist platform engineers and architects with:
- Architecture design, feature planning, and technical development checklists
- Live database schema inspection, column types, foreign keys, and RLS policies (use inspect_db_schema)
- Codebase structure and component registry search (use search_codebase)
- Technical documentation search (use search_knowledge_base with category: 'architecture_tech')

Be rigorous, structured, adhere to PostgreSQL Row Level Security boundaries, and enforce high software standards.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user role
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const userRole = profile?.role || "user";

    // 2. Parse request payload
    const body = await req.json();
    const {
      conversation_id,
      message,
      model_override,
      reasoning_override,
      action_confirmation,
    } = body;

    // -------------------------------------------------------------
    // Direct Confirmation Action Handling (Mutating Tools)
    // -------------------------------------------------------------
    if (action_confirmation) {
      const { tool_name, params: toolParams, is_approved } = action_confirmation;
      if (!is_approved) {
        return new Response(
          JSON.stringify({
            status: "cancelled",
            message: `Action '${tool_name}' was cancelled by admin.`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const execution = await executeAgentTool({
        toolName: tool_name,
        args: toolParams,
        userId: user.id,
        userRole,
        adminClient,
        geminiApiKey,
        isConfirmed: true,
      });

      // Post execution result into conversation
      if (conversation_id) {
        await adminClient.from("ai_messages").insert({
          conversation_id,
          role: "assistant",
          content: `✅ **Executed Action: ${tool_name}**\n\`\`\`json\n${JSON.stringify(execution.result, null, 2)}\n\`\`\``,
          metadata: { is_confirmed_action: true, execution },
        });
      }

      return new Response(JSON.stringify(execution), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!conversation_id || !message?.content) {
      return new Response(
        JSON.stringify({ error: "conversation_id and message.content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch conversation and check permissions
    const { data: conversation, error: convErr } = await adminClient
      .from("ai_conversations")
      .select("*")
      .eq("id", conversation_id)
      .single();

    if (convErr || !conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (conversation.user_id !== user.id && userRole !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Save incoming user message
    await adminClient.from("ai_messages").insert({
      conversation_id,
      role: message.role || "user",
      content: message.content,
      metadata: message.metadata || {},
    });

    // 5. Determine agent config & mode
    let agentKey = conversation.agent_name;
    if (agentKey === "backend_ops") {
      const isArchitect =
        message.content.includes("[Architect mode") ||
        conversation.metadata?.mode === "architect";
      agentKey = isArchitect ? "backend_ops_architect" : "backend_ops_operations";
    }

    const agentConfig = AGENT_CONFIGS[agentKey] || AGENT_CONFIGS.help_agent;
    const selectedModel = model_override || agentConfig.defaultModel;
    const selectedReasoning = reasoning_override || agentConfig.defaultReasoning;
    const availableTools = getToolsForAgent(agentKey);

    // 6. Fetch conversation history (last 15 messages)
    const { data: history } = await adminClient
      .from("ai_messages")
      .select("role, content, tool_calls, metadata")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(15);

    const messages: GatewayMessage[] = [
      { role: "system", content: agentConfig.systemPrompt },
      ...(history || []).map((m: any) => ({
        role: m.role === "tool" ? ("tool" as const) : m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content || "",
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      })),
    ];

    // 7. Multi-step Execution Loop (Up to 5 recursive turns)
    const MAX_TOOL_STEPS = 5;
    let stepCount = 0;
    let finalContent = "";
    const executedToolSteps: any[] = [];
    let pendingConfirmation: any = null;

    while (stepCount < MAX_TOOL_STEPS) {
      stepCount++;
      const stepStartTime = Date.now();

      const gatewayResp = await callAiGateway({
        model: selectedModel,
        messages,
        tools: availableTools,
        reasoningBudget: selectedReasoning,
      });

      // Check if model called any tools
      if (gatewayResp.toolCalls && gatewayResp.toolCalls.length > 0) {
        const assistantToolCallMsg: GatewayMessage = {
          role: "assistant",
          content: gatewayResp.content,
          tool_calls: gatewayResp.toolCalls,
        };
        messages.push(assistantToolCallMsg);

        // Execute each tool call
        for (const tc of gatewayResp.toolCalls) {
          const fnName = tc.function.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(tc.function.arguments || "{}");
          } catch {
            fnArgs = {};
          }

          const execResult = await executeAgentTool({
            toolName: fnName,
            args: fnArgs,
            userId: user.id,
            userRole,
            adminClient,
            isConfirmed: false,
          });

          const durationMs = Date.now() - stepStartTime;
          executedToolSteps.push({
            tool: fnName,
            args: fnArgs,
            status: execResult.status,
            duration_ms: durationMs,
            result: execResult.result,
          });

          // Log tool execution telemetry to ai_runs ledger
          await adminClient.from("ai_runs").insert({
            user_id: user.id,
            worker_id: `tool:${fnName}`,
            model: selectedModel,
            status: execResult.status === "error" ? "error" : "success",
            latency_ms: durationMs,
            correlation_id: conversation_id,
          });

          // If tool is mutating and requires confirmation, halt loop and return confirmation card
          if (execResult.status === "confirmation_required") {
            pendingConfirmation = execResult.confirmationPayload;
            break;
          }

          // Append tool result message for the next iteration
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            name: fnName,
            content: JSON.stringify(execResult.result || { error: execResult.error }),
          });
        }

        if (pendingConfirmation) {
          break;
        }
      } else {
        // No more tool calls; model returned final conversational answer
        finalContent = gatewayResp.content || "";
        break;
      }
    }

    const totalDuration = Date.now() - startTime;

    // Log overall run to ai_runs
    await adminClient.from("ai_runs").insert({
      user_id: user.id,
      worker_id: agentKey,
      model: selectedModel,
      latency_ms: totalDuration,
      status: "success",
      correlation_id: conversation_id,
    });

    // 8. Save Assistant reply with tool activity metadata to ai_messages
    const responseMetadata = {
      model_used: selectedModel,
      reasoning_level: selectedReasoning,
      tool_steps_count: executedToolSteps.length,
      tool_executions: executedToolSteps,
      latency_ms: totalDuration,
      ...(pendingConfirmation ? { pending_confirmation: pendingConfirmation } : {}),
    };

    const replyContent = pendingConfirmation
      ? `Action required: approval requested to execute **${pendingConfirmation.action}**.`
      : finalContent;

    const { data: savedMsg } = await adminClient
      .from("ai_messages")
      .insert({
        conversation_id,
        role: "assistant",
        content: replyContent,
        tool_calls: executedToolSteps.length > 0 ? executedToolSteps : null,
        metadata: responseMetadata,
      })
      .select()
      .single();

    // 9. Update conversation updated_at
    await adminClient
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return new Response(
      JSON.stringify(
        savedMsg || {
          role: "assistant",
          content: replyContent,
          metadata: responseMetadata,
        }
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[agent-message] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Agent Runtime error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
