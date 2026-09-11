// @ts-nocheck
// supabase/functions/_shared/embeddings.ts
// Utility for generating 768-dimensional vector embeddings using Vercel AI Gateway (openai/text-embedding-3-small).

const GATEWAY_EMBED_URL = "https://ai-gateway.vercel.sh/v1/embeddings";

export async function generateEmbedding(
  arg1: string,
  arg2?: string
): Promise<number[]> {
  // Support both generateEmbedding(text) and legacy generateEmbedding(apiKeyOrIgnored, text)
  const text = arg2 !== undefined ? arg2 : arg1;
  const customKey = (arg2 !== undefined && arg1 && arg1.startsWith("vck_")) ? arg1 : undefined;

  const apiKey =
    customKey ||
    Deno.env.get("VERCEL_AI_GATEWAY_KEY") ||
    Deno.env.get("VERCEL_AI_GATEWAY_TOKEN") ||
    Deno.env.get("AI_GATEWAY_KEY") ||
    Deno.env.get("AI_GATEWAY_API_KEY") ||
    "";

  if (!apiKey) {
    throw new Error("Missing VERCEL_AI_GATEWAY_KEY for embedding generation");
  }

  const cleanText = (text || "").trim().slice(0, 8000);
  if (!cleanText) {
    throw new Error("Text must not be empty for embedding generation");
  }

  const response = await fetch(GATEWAY_EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: cleanText,
      dimensions: 768,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(
      `AI Gateway Embedding API error (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  const values = data.data?.[0]?.embedding;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("AI Gateway returned empty or invalid embedding vector");
  }

  return values;
}
