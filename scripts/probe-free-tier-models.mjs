// Probe which Vercel AI Gateway models the current key can access.
// Free tier returns 403 for non-eligible models and 429 when rate-limited.
// Usage: node scripts/probe-free-tier-models.mjs
// Output: console table + logs/gateway-audit/model-access-<date>.json
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envText = fs.readFileSync(path.join(root, ".env"), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^["']|["']$/g, "").trim()])
);
const KEY = env.VERCEL_AI_GATEWAY_KEY || env.AI_GATEWAY_KEY || env.VERCEL_AI_GATEWAY_TOKEN || env.AI_GATEWAY_API_KEY;
if (!KEY) { console.error("No gateway key in .env"); process.exit(1); }

// Diverse shortlist spanning cheap flagships, minis, OSS, and the surfaces in use.
const MODELS = [
  // deepseek (current default tier)
  "deepseek/deepseek-v3.1", "deepseek/deepseek-v3.2", "deepseek/deepseek-v4-flash",
  "deepseek/deepseek-v4-pro", "deepseek/deepseek-r1",
  // google
  "google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "google/gemini-3-flash",
  "google/gemini-3.5-flash", "google/gemini-3.8-flash", "google/gemini-2.5-pro",
  // openai
  "openai/gpt-4o", "openai/gpt-4o-mini", "openai/gpt-4.1-mini", "openai/gpt-5-mini",
  "openai/gpt-5-nano", "openai/gpt-5.4-mini", "openai/gpt-oss-20b", "openai/gpt-oss-120b",
  // anthropic (control: expect 403 on sonnet-4.5 per Entry 018)
  "anthropic/claude-3-haiku", "anthropic/claude-haiku-4.5", "anthropic/claude-sonnet-4.5",
  // other value picks
  "meta/llama-4-scout", "zai/glm-4.5-air", "zai/glm-4.7-flash",
  "mistral/mistral-small", "mistral/ministral-8b", "moonshotai/kimi-k2",
  // embeddings (in use)
  "openai/text-embedding-3-small",
];

const results = [];
for (const model of MODELS) {
  const isEmbedding = model.includes("embedding");
  const body = isEmbedding
    ? { model, input: "ping" }
    : { model, messages: [{ role: "user", content: "hi" }], max_tokens: 1 };
  const url = isEmbedding
    ? "https://ai-gateway.vercel.sh/v1/embeddings"
    : "https://ai-gateway.vercel.sh/v1/chat/completions";
  let status = 0, snippet = "";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body),
    });
    status = res.status;
    if (!res.ok) snippet = (await res.text()).slice(0, 140).replace(/\s+/g, " ");
    else await res.json(); // drain
  } catch (e) { snippet = e.message; }
  results.push({ model, status, ok: status === 200, note: snippet });
  console.log(String(status).padEnd(5), model, snippet ? `| ${snippet.slice(0, 90)}` : "");
  await new Promise((r) => setTimeout(r, 1600)); // stay under burst 429s (Entry 018)
}

const free = results.filter((r) => r.ok).map((r) => r.model);
const blocked = results.filter((r) => r.status === 403).map((r) => r.model);
console.log(`\nFREE-TIER OK (${free.length}):`); free.forEach((m) => console.log("  +", m));
console.log(`BLOCKED 403 (${blocked.length}):`); blocked.forEach((m) => console.log("  -", m));

const outDir = path.join(root, "logs", "gateway-audit");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `model-access-${new Date().toISOString().slice(0, 10)}.json`), JSON.stringify(results, null, 2));
console.log("\nSaved to logs/gateway-audit/ (git-ignored)");
