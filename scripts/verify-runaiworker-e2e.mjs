/**
 * E2E for the InvokeLLM removal (Entry 031): the centralized workers must execute
 * through ai-run with their registry prompts/schemas — no client-side prompts anymore.
 * Checks: aqla_intelligence_turn (member chat), plan_review (Sante medical model),
 * clinical_summary (Sante), inbox_thread_summary (clinician-gated).
 * Usage: node scripts/verify-runaiworker-e2e.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(process.cwd());
const envText = fs.readFileSync(path.join(root, ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const memory = JSON.parse(fs.readFileSync(path.join(root, "logs/agent-memory/session-state.json"), "utf8"));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "✓" : "✗"} ${name}${extra ? ` — ${extra}` : ""}`); ok ? pass++ : fail++; };

const login = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/aqla-ops`, {
  method: "POST", headers: { "Content-Type": "application/json", apikey: env.VITE_SUPABASE_ANON_KEY },
  body: JSON.stringify({ action: "loginWithPasscode", passcode: memory.test_account.passcode }),
});
const { token_hash } = await login.json();
const { data: otp, error: otpErr } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash, options: { type: "magiclink" } });
if (otpErr || !otp?.session?.access_token) { console.error("auth failed:", otpErr?.message); process.exit(1); }
const token = otp.session.access_token;
console.log("✓ admin session obtained\n");

const callWorker = async (worker_id, input_data, model) => {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/ai-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ worker_id, input_data, ...(model ? { model } : {}) }),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
  return { status: res.status, data };
};

// T1: aqla_intelligence_turn — chat mode through the registry prompt
const t1 = await callWorker("aqla_intelligence_turn", {
  brain_domains: [], active_protocol: null, available_plan_families: [], recent_check_ins: [], experiments: [],
  user_question: "hey, what's up?",
});
check("T1 aqla_intelligence_turn chat reply", t1.status === 200 && !!t1.data?.chat_reply, `mode=${t1.data?.mode} reply="${(t1.data?.chat_reply || "").slice(0, 60)}"`);
await new Promise((r) => setTimeout(r, 2500));

// T2: plan_review — must run on the Sante medical model per registry
const t2 = await callWorker("plan_review", {
  current_plan: { family: "SPARK", objective: "lift morning focus" },
  daily_check_ins: [
    { clarity: 6, energy: 5, stress: 6, sleep: 6, note: "slight afternoon slump" },
    { clarity: 7, energy: 6, stress: 5, sleep: 7, note: "clearer after adjusting sleep" },
  ],
  user_review: { liked: "morning sessions", disliked: "none" },
});
const t2Ok = t2.status === 200 && typeof t2.data?.should_switch === "boolean";
check("T2 plan_review structured output", t2Ok, t2Ok ? `should_switch=${t2.data.should_switch} family=${t2.data.recommended_family}` : JSON.stringify(t2.data).slice(0, 140));
await new Promise((r) => setTimeout(r, 2500));

// T3: clinical_summary — Sante medical model
const t3 = await callWorker("clinical_summary", {
  member: { name: "E2E Member", protocol_day: 9, protocol_family: "SPARK" },
  checkins: [{ date: "2026-09-17", clarity: 7, energy: 6, stress: 5, sleep_quality: 7 }],
  domain_scores: [{ domain: "Focus Depth", score: 58, trend: "improving" }],
  risk_flags: [],
});
check("T3 clinical_summary structured output", t3.status === 200 && !!t3.data?.executive_summary, (t3.data?.executive_summary || "").slice(0, 80));
await new Promise((r) => setTimeout(r, 2500));

// T4: inbox_thread_summary — clinician-gated worker
const t4 = await callWorker("inbox_thread_summary", {
  conversation: "[Message 1 - From: patient@test.aqla.io] Subject: quick question\nBody: I felt sharper after the protocol change but afternoons are still rough.",
  patient_context: { name: "E2E Member", active_protocol: "SPARK", protocol_family: "SPARK", readiness_avg: 72, weakest_domain: "Focus Depth", weakest_domain_score: 58 },
});
const t4Ok = t4.status === 200 && Array.isArray(t4.data?.summary_bullets);
check("T4 inbox_thread_summary output", t4Ok, t4Ok ? `urgency=${t4.data.clinical_urgency} bullets=${t4.data.summary_bullets.length}` : JSON.stringify(t4.data).slice(0, 140));

// Routing proof from the audit ledger
const authed = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${token}` } },
  auth: { persistSession: false, autoRefreshToken: false },
});
const testStart = new Date(Date.now() - 5 * 60 * 1000).toISOString();
const { data: runs } = await authed.from("ai_runs").select("worker_id, model, status").gte("created_at", testStart).order("created_at", { ascending: false }).limit(20);
const sante = (runs || []).filter((r) => (r.model || "").includes("ling-3.0-flash-sante"));
check("T5 ai_runs ledger: plan_review + clinical_summary on Sante", sante.length >= 2, `sante rows=${sante.length} (${sante.map((r) => r.worker_id).join(", ")})`);

console.log(`\n${pass} passed / ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
