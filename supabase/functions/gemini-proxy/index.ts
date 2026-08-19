// supabase/functions/gemini-proxy/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS Preflight OPTIONS request immediately
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY environment variable is not set on the backend." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse payload
    const payload = await req.json();
    const { model, prompt, response_json_schema, system_instruction, contents } = payload;

    // Use selected model, falling back to gemini-3.6-flash as the standard backend model
    let targetModel = model || "models/gemini-3.6-flash";
    if (targetModel && !targetModel.startsWith("models/")) {
      targetModel = `models/${targetModel}`;
    }

    // Construct request body for Gemini API
    let requestBody;
    if (contents) {
      requestBody = {
        contents,
        generationConfig: {
          temperature: payload.generationConfig?.temperature ?? 0.7,
          maxOutputTokens: payload.generationConfig?.maxOutputTokens ?? 8192,
          ...(response_json_schema
            ? {
                responseMimeType: "application/json",
                responseSchema: response_json_schema,
              }
            : {}),
        },
      };
    } else {
      requestBody = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          ...(response_json_schema
            ? {
                responseMimeType: "application/json",
                responseSchema: response_json_schema,
              }
            : {}),
        },
      };
    }

    if (system_instruction) {
      requestBody.systemInstruction = { parts: [{ text: system_instruction }] };
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[gemini-proxy] Error executing proxy request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
