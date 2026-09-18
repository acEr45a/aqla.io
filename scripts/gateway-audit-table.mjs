#!/usr/bin/env node
// scripts/gateway-audit-table.mjs — render decision-ready summary.md from audit results.
// Usage: node scripts/gateway-audit-table.mjs [--out-dir logs/gateway-model-audit]

import fs from "node:fs";

const OUT_DIR = process.argv.includes("--out-dir") ? process.argv[process.argv.indexOf("--out-dir") + 1] : "logs/gateway-model-audit";
const results = JSON.parse(fs.readFileSync(`${OUT_DIR}/results.json`, "utf8"));
const catalog = JSON.parse(fs.readFileSync(`${OUT_DIR}/catalog.json`, "utf8"));
const catalogCount = catalog.count ?? catalog.models?.data?.length ?? 0;

const LABEL = {
  ok: "✅ OK",
  "blocked-free-tier": "⛔ blocked (403 free tier)",
  "payment-required": "💳 payment required (402)",
  "rate-limited": "⏳ rate-limited (429, persisted after retries)",
  "not-found": "❓ not found (404)",
  unauthorized: "🔑 unauthorized (401)",
  "bad-request": "⚠️ bad request (400)",
  "skipped-non-chat": "⏭️ skipped (non-chat model)",
};
const label = (r) => LABEL[r.classification] ?? `⚠️ ${r.classification}`;
const providerOf = (id) => (id.includes("/") ? id.split("/")[0] : "(other)");
const lastLatency = (r) => (r.attempts?.length ? r.attempts[r.attempts.length - 1].latencyMs : null);

const counts = {};
for (const r of results.results) counts[r.classification] = (counts[r.classification] || 0) + 1;
const countsLine = Object.entries(counts).map(([k, v]) => `${k}=${v}`).sort().join(" ");

const providers = [...new Set(results.results.map((r) => providerOf(r.model)))].sort();
const rank = (r) => (r.classification === "ok" ? 0 : r.classification === "rate-limited" ? 1 : 2);

let md = `# Vercel AI Gateway — free-tier model audit\n\n`;
md += `Generated: ${new Date().toISOString()}\n\n`;
md += `Catalog models listed by the key: **${catalogCount}** · results recorded: **${results.results.length}**\n\n`;
md += `Probe: POST /v1/chat/completions, prompt "Reply with the single word: ok", max_tokens 16 (auto-retried without max_tokens where rejected). 429s retried up to 5 attempts with 10-60s backoffs.\n\n`;
md += `## Outcome totals\n\n`;
for (const [k, v] of Object.entries(counts).sort()) md += `- ${LABEL[k] ?? k}: **${v}**\n`;
md += `\n## Per-model results\n\n`;
for (const p of providers) {
  const rows = results.results.filter((r) => providerOf(r.model) === p).sort((a, b) => rank(a) - rank(b) || a.model.localeCompare(b.model));
  md += `### ${p} (${rows.length})\n\n`;
  md += `| Model | Status | HTTP | Latency (ms) | Note |\n|---|---|---|---|---|\n`;
  for (const r of rows) {
    const note = (r.content && `content: ${JSON.stringify(r.content)}`) || r.snippet || r.reason || "";
    const lat = lastLatency(r);
    md += `| \`${r.model}\` | ${label(r)} | ${r.httpStatus ?? "—"} | ${lat ?? "—"} | ${String(note).replace(/\|/g, "\\|").replace(/\n/g, " ").slice(0, 160)} |\n`;
  }
  md += `\n`;
}
md += `## Recommendation inputs\n\n`;
const okModels = results.results.filter((r) => r.classification === "ok").map((r) => r.model);
const limited = results.results.filter((r) => r.classification === "rate-limited").map((r) => r.model);
md += `- **Usable now (HTTP 200):** ${okModels.length ? okModels.map((m) => `\`${m}\``).join(", ") : "none"}\n`;
md += `- **Exists but rate-limited even after spaced retries:** ${limited.length ? limited.map((m) => `\`${m}\``).join(", ") : "none"}\n\n`;
md += `COUNTS ${countsLine}\n`;

fs.writeFileSync(`${OUT_DIR}/summary.md`, md);
console.log(`Wrote ${OUT_DIR}/summary.md (${results.results.length} rows, COUNTS ${countsLine})`);
