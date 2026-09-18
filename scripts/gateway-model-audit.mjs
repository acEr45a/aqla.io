#!/usr/bin/env node
// scripts/gateway-model-audit.mjs
// Vercel AI Gateway free-tier model audit.
// 1. Fetch the REAL model catalog from /v1/models using the project's gateway key.
// 2. Probe EVERY chat-capable model with a minimal chat completion.
// 3. Classify each outcome (ok / blocked-free-tier / payment-required / rate-limited / ...).
// Results are saved incrementally so an interrupted run can be resumed with --resume.
// The API key is NEVER printed or written to any artifact.
//
// Usage:
//   node scripts/gateway-model-audit.mjs [--out-dir logs/gateway-model-audit] [--delay 5000] [--max N] [--only SUBSTRING] [--resume]

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const argVal = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};

const OUT_DIR = argVal("--out-dir", "logs/gateway-model-audit");
const DELAY_MS = Number(argVal("--delay", "5000"));
const MAX_MODELS = Number(argVal("--max", "0")) || Infinity;
const ONLY = argVal("--only", "");
const RESUME = args.includes("--resume");
const BASE = "https://ai-gateway.vercel.sh/v1";
const KEY_NAMES = ["VERCEL_AI_GATEWAY_KEY", "VERCEL_AI_GATEWAY_TOKEN", "AI_GATEWAY_KEY", "AI_GATEWAY_API_KEY"];

function loadKey() {
  try {
    const env = fs.readFileSync(".env", "utf8").replace(/^\uFEFF/, "");
    for (const name of KEY_NAMES) {
      const m = env.match(new RegExp(`^\\s*${name}=(.*)$`, "m"));
      if (m && m[1].trim()) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env optional */
  }
  for (const name of KEY_NAMES) if (process.env[name]) return process.env[name];
  throw new Error("No Vercel AI Gateway key found in .env or environment");
}
const KEY = loadKey();

fs.mkdirSync(OUT_DIR, { recursive: true });
const RESULTS_PATH = path.join(OUT_DIR, "results.json");
const CATALOG_PATH = path.join(OUT_DIR, "catalog.json");
const LOG_PATH = path.join(OUT_DIR, "progress.log");

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
};

// Defense in depth: never let the key reach an artifact.
const redact = (s) => (typeof s === "string" && KEY && s.includes(KEY) ? s.split(KEY).join("***REDACTED***") : s);

async function call(url, options) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(45000) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { _raw: text.slice(0, 500) };
  }
  return { status: res.status, body };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function snippet(body) {
  const msg = body?.error?.message ?? body?.message ?? body?.detail;
  const s = typeof msg === "string" ? msg : JSON.stringify(body ?? {});
  return redact(s.slice(0, 300));
}
function extractContent(body) {
  const c = body?.choices?.[0]?.message?.content;
  return typeof c === "string" ? redact(c.slice(0, 200)) : "";
}
function classify(status) {
  if (status === 200) return "ok";
  if (status === 403) return "blocked-free-tier";
  if (status === 402) return "payment-required";
  if (status === 429) return "rate-limited";
  if (status === 404) return "not-found";
  if (status === 401) return "unauthorized";
  if (status === 400) return "bad-request";
  return `http-${status}`;
}

// --- 1. Catalog (the only source of model ids — nothing is invented) ---
log("Fetching model catalog from gateway /v1/models ...");
const cat = await call(`${BASE}/models`, { headers: { Authorization: `Bearer ${KEY}` } });
if (cat.status !== 200) {
  log(`FATAL: /v1/models returned HTTP ${cat.status}: ${snippet(cat.body)}`);
  process.exit(2);
}
const catalogModels = cat.body?.data ?? cat.body?.models ?? [];
const ids = catalogModels.map((m) => (typeof m === "string" ? m : m?.id)).filter(Boolean);
if (!ids.length) {
  log("FATAL: catalog listing is empty — refusing to audit without a real list (no hallucinated models).");
  process.exit(2);
}
fs.writeFileSync(
  CATALOG_PATH,
  JSON.stringify({ fetchedAt: new Date().toISOString(), endpoint: `${BASE}/models`, count: ids.length, models: cat.body }, null, 2)
);
log(`Catalog listed ${ids.length} models.`);

// --- 2. Probe every model ---
let state = { startedAt: new Date().toISOString(), updatedAt: null, catalogCount: ids.length, results: [] };
if (RESUME && fs.existsSync(RESULTS_PATH)) {
  try {
    const prior = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
    if (Array.isArray(prior.results)) {
      state = { ...state, ...prior, catalogCount: ids.length };
      log(`Resuming: ${state.results.length} existing results loaded.`);
    }
  } catch (e) {
    log(`WARN: could not parse prior results (${e.message}); starting fresh.`);
  }
}
const resultFor = (id) => state.results.find((r) => r.model === id);
const save = () => {
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(state, null, 2));
};

const BACKOFFS = [10000, 20000, 40000, 60000];
const SKIPPED_RE = /embedding|moderation|rerank/i;

async function probe(id) {
  const attempts = [];
  let noMaxTokens = false;
  for (let i = 1; i <= 5; i++) {
    const bodyObj = { model: id, messages: [{ role: "user", content: "Reply with the single word: ok" }] };
    if (!noMaxTokens) bodyObj.max_tokens = 16;
    const t0 = Date.now();
    let out;
    try {
      out = await call(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj),
      });
    } catch (e) {
      out = { status: 0, body: { error: { message: String(e?.cause?.message || e?.message || "network error") } } };
    }
    const attempt = {
      n: i,
      at: new Date().toISOString(),
      url: `${BASE}/chat/completions`,
      method: "POST",
      httpStatus: out.status,
      latencyMs: Date.now() - t0,
      snippet: snippet(out.body),
      content: extractContent(out.body),
      finishReason: out.body?.choices?.[0]?.finish_reason ?? null,
    };
    attempts.push(attempt);
    if (out.status === 200) return { final: "ok", attempts };
    const msg = String(out.body?.error?.message || out.body?.message || "").toLowerCase();
    if (out.status === 400 && !noMaxTokens && /max[_ ]?tokens|unsupported[_ ]parameter|unknown[_ ]parameter/.test(msg)) {
      log(`  ${id}: 400 on max_tokens — retrying without it`);
      noMaxTokens = true;
      continue;
    }
    if (out.status === 429 && i < 5) {
      const w = BACKOFFS[Math.min(i - 1, BACKOFFS.length - 1)];
      log(`  ${id}: 429 — backing off ${w / 1000}s (attempt ${i}/5)`);
      await sleep(w);
      continue;
    }
    if ((out.status >= 500 || out.status === 0) && i < 5) {
      await sleep(5000);
      continue;
    }
    return { final: classify(out.status), attempts };
  }
  return { final: "rate-limited", attempts };
}

const unique = new Set();
let probed = 0;
for (const id of ids) {
  if (probed >= MAX_MODELS) break;
  if (ONLY && !id.includes(ONLY)) continue;
  if (unique.has(id)) continue;
  unique.add(id);

  const prior = resultFor(id);
  const priorTerminal =
    prior &&
    prior.classification &&
    prior.classification !== "pending" &&
    prior.classification !== "rate-limited"; // resume always retries rate-limited models
  if (priorTerminal) continue;

  if (SKIPPED_RE.test(id)) {
    state.results.push({
      model: id,
      classification: "skipped-non-chat",
      reason: "embedding/moderation/rerank model — not chat-completions capable",
      url: `${BASE}/chat/completions`,
      method: "POST",
      httpStatus: null,
      attempts: [],
      probedAt: new Date().toISOString(),
    });
    save();
    continue;
  }

  log(`Probing ${id} ...`);
  const { final, attempts } = await probe(id);
  const last = attempts[attempts.length - 1];
  state.results.push({
    model: id,
    classification: final,
    httpStatus: last.httpStatus,
    url: last.url,
    method: last.method,
    content: last.content,
    snippet: last.snippet,
    finishReason: last.finishReason,
    attempts,
    probedAt: new Date().toISOString(),
  });
  save();
  probed++;
  const hit429 = attempts.some((a) => a.httpStatus === 429);
  await sleep(DELAY_MS + (hit429 ? 10000 : 0));
}

// --- 3. Summary ---
const counts = {};
for (const r of state.results) counts[r.classification] = (counts[r.classification] || 0) + 1;
const covered = state.results.length;
log(`AUDIT RUN FINISHED — ${covered}/${ids.length} catalog models have results`);
for (const [k, v] of Object.entries(counts).sort()) log(`  ${k}: ${v}`);
if (covered < ids.length) {
  log(`INCOMPLETE: ${ids.length - covered} catalog models still unprobed — rerun with --resume to continue.`);
  process.exit(3);
}
log("ALL CATALOG MODELS PROBED");
