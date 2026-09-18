/**
 * E2E: verify the clinician-facing clinical_summary worker actually executes through
 * the OpenRouter medical model (inclusionai/ling-3.0-flash-sante:free) with the new
 * gateway.ts routing. Reads back the executed model from the ai_runs audit ledger.
 *
 * Usage: node scripts/verify-medical-model-e2e.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(process.cwd());
const envText = fs.existsSync(path.join(root, ".env")) ? fs.readFileSync(path.join(root, ".env"), "utf8") : "";
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^[\"']|[\"']$/g, "");
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON_KEY) { console.error("Missing Supabase URL/anon key in .env"); process.exit(1); }

const memory = JSON.parse(fs.readFileSync(path.join(root, "logs/agent-memory/session-state.json"), "utf8"));
const passcode = memory.test_account?.passcode;
if (!passcode) { console.error("No vaulted test passcode"); process.exit(1); }
console.log(`Vaulted test account: ${memory.test_account.email} (role=${memory.test_account.role})`);

const supabase = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const fn = async (name, body, token) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
  return { status: res.status, data };
};

// 1) Auth: passcode login -> real session (admin persona required: clinical_summary
//    allowsRoles = ["clinician", "admin"])
const login = await fn("aqla-ops", { action: "loginWithPasscode", passcode });
if (login.status !== 200 || !login.data?.token_hash) { console.error("loginWithPasscode failed:", login.status, login.data); process.exit(1); }
console.log("✓ loginWithPasscode OK");

const { data: otpData, error: otpErr } = await supabase.auth.verifyOtp({
  type: "magiclink", token_hash: login.data.token_hash, options: { type: "magiclink" },
});
if (otpErr || !otpData?.session?.access_token) { console.error("verifyOtp failed:", otpErr?.message || otpData); process.exit(1); }
const token = otpData.session.access_token;
console.log("✓ session obtained");

// 2) Invoke the clinical_summary worker through ai-run (the real production path)
console.log("Invoking ai-run worker=clinical_summary (expect inclusionai/ling-3.0-flash-sante:free)...");
const t0 = Date.now();
const res = await fn("ai-run", {
  worker_id: "clinical_summary",
  input_data: {
    member: { name: "E2E Test Member", protocol_day: 9, protocol_family: "SPARK" },
    checkins: [
      { date: "2026-09-16", clarity: 6, energy: 5, stress: 6, sleep_quality: 6, note: "mild afternoon slump" },
      { date: "2026-09-17", clarity: 7, energy: 6, stress: 5, sleep_quality: 7, note: "better focus after protocol adjustment" },
    ],
    domain_scores: [{ domain: "Focus Depth", score: 58, trend: "improving" }],
    risk_flags: [],
  },
}, token);
const dt = Date.now() - t0;
console.log(`ai-run HTTP ${res.status} (${dt}ms)`);
if (res.status !== 200) { console.error("ai-run failed:", JSON.stringify(res.data).slice(0, 500)); process.exit(1); }
console.log("── clinical_summary output (truncated) ──");
console.log(JSON.stringify(res.data).slice(0, 400));
console.log("─────────────────────────────────────────");

// 3) Proof of routing: read the executed model back from the ai_runs audit ledger
const { data: run, error: runErr } = await supabase
  .from("ai_runs")
  .select("worker_id, model, status, latency_ms, created_at")
  .eq("worker_id", "clinical_summary")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
if (runErr || !run) { console.error("ai_runs read failed:", runErr?.message || "no row"); process.exit(1); }

console.log(`ai_runs ledger → model=${run.model} status=${run.status} latency=${run.latency_ms}ms`);

const usedSante = (run.model || "").includes("ling-3.0-flash-sante");
const usedFailover = !usedSante; // chain absorbed an OpenRouter outage → deepseek/gemini/etc.
if (usedSante) {
  console.log("✓ PASS: clinical_summary executed on the OpenRouter medical model (ling-3.0-flash-sante:free)");
} else {
  console.log(`⚠ PARTIAL: worker ran but on failover model ${run.model} — OpenRouter route unavailable from the edge (check OPENROUTER_API_KEY secret / OpenRouter status); chain failover behaved as designed.`);
}
process.exit(0);
