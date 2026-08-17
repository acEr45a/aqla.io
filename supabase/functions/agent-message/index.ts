// @ts-nocheck
// supabase/functions/agent-message/index.ts
// AQLA Agent Runtime Edge Function
// Drives Help Agent and Backend Ops (Operations & Architect modes).

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiGenerate } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_CONFIGS: Record<string, {
  model: "gemini-2.5-flash" | "gemini-2.0-flash-lite";
  thinkingBudget: "none" | "low" | "medium" | "high";
  systemPrompt: string;
}> = {
  help_agent: {
    model: "gemini-2.5-flash",
    thinkingBudget: "medium",
    systemPrompt: `You are the AQLA Help Assistant inside the AQLA brain-performance platform.
Your purpose is to answer member questions clearly, warmly, and accurately regarding:
- Their Brain Map, cognitive tests, daily check-ins, and active protocols
- How platform features and tools work
- Evidence-based lifestyle and cognitive habits

STRICT BOUNDARIES:
- Never provide medical diagnosis, prescribe treatments, or recommend specific pharmaceutical dosages.
- Always recommend consulting a healthcare professional for clinical concerns.
- If discussing supplements, always mention evidence levels and caution.`,
  },

  backend_ops_operations: {
    model: "gemini-2.5-flash",
    thinkingBudget: "high",
    systemPrompt: `You are AQLA Backend Ops in OPERATIONS mode.
You assist platform administrators and engineers with:
- System diagnostics, database schema analysis, and service metrics
- Identifying stuck user onboarding flows or missing check-ins
- Delivery status of email digests and summaries
- Recommending operational actions and system maintenance

Be concise, technical, precise, and objective. Ground all suggestions in data.`,
  },

  backend_ops_architect: {
    model: "gemini-2.5-flash",
    thinkingBudget: "high",
    systemPrompt: `You are AQLA Backend Ops in ARCHITECT mode.
You assist with:
- Architecture design, feature planning, and development checklists
- Ideation and refinement of cognitive games, tools, and UX improvements
- Migration analysis and codebase structuring
- Safety, security, and clinical review evaluations

Be structured, creative yet rigorous, and maintain high standards of software quality.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";

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

    // 2. Parse request
    const { conversation_id, message } = await req.json();
    if (!conversation_id || !message?.content) {
      return new Response(
        JSON.stringify({ error: "conversation_id and message.content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Fetch conversation and verify ownership or admin role
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

    // Check ownership or admin
    if (conversation.user_id !== user.id) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 4. Save user message to database
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

    // 6. Load recent conversation history (last 15 messages)
    const { data: history } = await adminClient
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(15);

    const contents = (history || []).map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content || "" }],
    }));

    // 7. Invoke Gemini
    const result = await geminiGenerate(geminiApiKey, {
      model: agentConfig.model,
      systemInstruction: agentConfig.systemPrompt,
      contents,
      thinkingBudget: agentConfig.thinkingBudget,
    });

    const assistantContent = result.text;

    // 8. Save assistant reply to database (triggers Supabase Realtime broadcast)
    const { data: savedMsg, error: saveErr } = await adminClient
      .from("ai_messages")
      .insert({
        conversation_id,
        role: "assistant",
        content: assistantContent,
      })
      .select()
      .single();

    // 9. Update conversation updated_at
    await adminClient
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return new Response(
      JSON.stringify(savedMsg || { role: "assistant", content: assistantContent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[agent-message] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Agent Runtime error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
