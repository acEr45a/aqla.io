#!/usr/bin/env node
// scripts/verify-gateway-audit.mjs — unlazy gate verifier for the gateway model audit.
// Usage: node scripts/verify-gateway-audit.mjs --gate <1|2|3|4>
// Exits 0 and prints the gate's success marker only if every assertion passes.

import fs from "node:fs";

const OUT_DIR = "logs/gateway-model-audit";
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

function loadKey() {
  const KEY_NAMES = ["VERCEL_AI_GATEWAY_KEY", "VERCEL_AI_GATEWAY_TOKEN", "AI_GATEWAY_KEY", "AI_GATEWAY_API_KEY"];
  try {
    const env = fs.readFileSync(".env", "utf8").replace(/^\uFEFF/, "");
    for (const name of KEY_NAMES) {
      const m = env.match(new RegExp(`^\\s*${name}=(.*)$`, "m"));
      if (m && m[1].trim()) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
  for (const name of KEY_NAMES) if (process.env[name]) return process.env[name];
  return null;
}

const gate = process.argv[process.argv.indexOf("--gate") + 1];
const results = readJson(`${OUT_DIR}/results.json`);
const catalog = readJson(`${OUT_DIR}/catalog.json`);
const catalogModels = catalog.models?.data ?? catalog.models?.models ?? [];
const ids = [...new Set(catalogModels.map((m) => (typeof m === "string" ? m : m?.id)).filter(Boolean))];
const byId = new Map(results.results.map((r) => [r.model, r]));
const TERMINAL = new Set(["ok", "blocked-free-tier", "payment-required", "rate-limited", "not-found", "unauthorized", "bad-request", "skipped-non-chat"]);
const isTerminal = (c) => TERMINAL.has(c) || /^http-\d+$/.test(c || "");
const fail = (msg) => {
  console.error(`GATE ${gate} FAIL: ${msg}`);
  process.exit(1);
};

if (gate === "1") {
  // G1: results file covers every catalog model the gateway key can list.
  if (!ids.length) fail("catalog.json lists no models");
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) fail(`${missing.length} catalog models have no result, e.g. ${missing.slice(0, 5).join(", ")}`);
  const pending = ids.filter((id) => !isTerminal(byId.get(id).classification));
  if (pending.length) fail(`${pending.length} results are non-terminal, e.g. ${pending.slice(0, 5).join(", ")}`);
  if (results.results.length !== ids.length) fail(`duplicate/extra results: ${results.results.length} vs catalog ${ids.length}`);
  const softLimited = results.results.filter((r) => r.classification === "rate-limited" && (r.attempts?.length ?? 0) < 4);
  if (softLimited.length) fail(`${softLimited.length} rate-limited results were retried fewer than 4 times: ${softLimited.slice(0, 5).map((r) => r.model).join(", ")}`);
  console.log("gateway audit results complete");
  process.exit(0);
}

if (gate === "2") {
  // G2: every recorded outcome carries a real HTTP transcript from the gateway.
  for (const r of results.results) {
    if (!ids.includes(r.model)) fail(`result model not present in fetched catalog: ${r.model} (hallucination guard)`);
    if (r.classification === "skipped-non-chat") continue; // not probed by design
    if (typeof r.httpStatus !== "number" || r.httpStatus < 100) fail(`${r.model}: no HTTP status recorded`);
    if (r.url !== "https://ai-gateway.vercel.sh/v1/chat/completions") fail(`${r.model}: unexpected probe URL ${r.url}`);
    if (r.method !== "POST") fail(`${r.model}: probe method was not POST`);
    if (!Array.isArray(r.attempts) || r.attempts.length < 1) fail(`${r.model}: no attempt transcript`);
    for (const a of r.attempts) {
      if (typeof a.httpStatus !== "number") fail(`${r.model}: attempt ${a.n} lacks httpStatus`);
      if (typeof a.latencyMs !== "number") fail(`${r.model}: attempt ${a.n} lacks latencyMs`);
      if (typeof a.snippet !== "string") fail(`${r.model}: attempt ${a.n} lacks response snippet`);
      if (a.url !== "https://ai-gateway.vercel.sh/v1/chat/completions" || a.method !== "POST") fail(`${r.model}: attempt ${a.n} transcript malformed`);
    }
  }
  console.log("every result carries a real HTTP transcript");
  process.exit(0);
}

if (gate === "3") {
  // G3: decision-ready summary table rendered and internally consistent.
  if (!fs.existsSync(`${OUT_DIR}/summary.md`)) fail("summary.md missing");
  const summary = fs.readFileSync(`${OUT_DIR}/summary.md`, "utf8");
  const rowsMissing = results.results.filter((r) => !summary.includes(r.model));
  if (rowsMissing.length) fail(`summary.md missing rows for ${rowsMissing.length} models, e.g. ${rowsMissing.slice(0, 5).map((r) => r.model).join(", ")}`);
  const counts = {};
  for (const r of results.results) counts[r.classification] = (counts[r.classification] || 0) + 1;
  const expected = Object.entries(counts).map(([k, v]) => `${k}=${v}`).sort().join(" ");
  const m = summary.match(/COUNTS (.+)/);
  if (!m) fail("summary.md lacks machine COUNTS footer");
  const actual = m[1].trim().split(/\s+/).sort().join(" ");
  if (actual !== expected) fail(`COUNTS mismatch: summary says [${actual}] but results recount is [${expected}]`);
  console.log("audit summary rendered");
  process.exit(0);
}

if (gate === "4") {
  // G4: no gateway secret appears in any audit artifact.
  const key = loadKey();
  if (!key) fail("could not load gateway key from .env to run the leak check");
  const files = [`${OUT_DIR}/catalog.json`, `${OUT_DIR}/results.json`, `${OUT_DIR}/summary.md`, `${OUT_DIR}/progress.log`].filter((p) => fs.existsSync(p));
  for (const p of files) {
    const text = fs.readFileSync(p, "utf8");
    if (text.includes(key)) fail(`gateway key leaked into ${p}`);
  }
  console.log("no secrets leaked");
  process.exit(0);
}

fail(`unknown gate: ${gate}`);
