// @ts-nocheck
// supabase/functions/_shared/embeddings.ts
// Utility for generating 768-dimensional vector embeddings using Google Gemini text-embedding-004.

const GEMINI_EMBED_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export async function generateEmbedding(
  apiKey: string,
  text: string
): Promise<number[]> {
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY for embedding generation");
  }

  const cleanText = (text || "").trim().slice(0, 8000);
  if (!cleanText) {
    throw new Error("Text must not be empty for embedding generation");
  }

  const url = `${GEMINI_EMBED_BASE}/text-embedding-004:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: {
        parts: [{ text: cleanText }],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(
      `Gemini Embedding API error (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  const values = data.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini returned empty or invalid embedding vector");
  }

  return values;
}
