/**
 * Isolate which variable breaks the backend_ops AI path:
 * A) agent_name (backend_ops vs help_agent)
 * B) model_override (claude vs default)
 * C) reasoning_override (high vs none)
 * Usage: node scripts/isolate-ops-ai.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const memory = JSON.parse(fs.readFileSync(path.join(root, "logs/agent-memory/session-state.json"), "utf8"));
const passcode = memory.test_account.passcode;

const supabase = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function fn(name, body, token) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
  return { status: res.status, data };
}

const login = await fn("aqla-ops", { action: "loginWithPasscode", passcode });
const otp = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: login.data.token_hash });
if (otp.error || !otp.data?.session) { console.error("auth failed", otp.error?.message); process.exit(1); }
const token = otp.data.session.access_token;
const userId = otp.data.user.id;
console.log("authenticated:", otp.data.user.email);

const scenarios = [
  { name: "D: backend_ops + deepseek-v3.1 override", agent: "backend_ops", model: "deepseek/deepseek-v3.1", reasoning: undefined },
  { name: "E: backend_ops + gemini-2.5-flash override", agent: "backend_ops", model: "google/gemini-2.5-flash", reasoning: undefined },
];

for (const sc of scenarios) {
  const convId = crypto.randomUUID();
  const { error: convErr } = await supabase.from("ai_conversations").insert([
    { id: convId, user_id: userId, agent_name: sc.agent, metadata: { name: "isolation-test", mode: "ops" } },
  ]);
  if (convErr) { console.error(`[${sc.name}] conv insert failed:`, convErr.message); continue; }

  const t0 = Date.now();
  const r = await fn("agent-message", {
    conversation_id: convId,
    message: { role: "user", content: "[Backend Ops mode — platform health, metrics, data diagnostics]\n\nReply with exactly: OK", metadata: {} },
    ...(sc.model ? { model_override: sc.model } : {}),
    ...(sc.reasoning ? { reasoning_override: sc.reasoning } : {}),
  }, token);
  const dt = Date.now() - t0;
  const content = r.data?.content || r.data?.error || JSON.stringify(r.data).slice(0, 150);
  console.log(`\n[${sc.name}] HTTP ${r.status} in ${dt}ms`);
  console.log(`  reply: ${String(content).slice(0, 220)}`);
  console.log(`  model: ${r.data?.model || "?"} | tools: ${Array.isArray(r.data?.tool_calls) ? r.data.tool_calls.length : 0}`);

  await supabase.from("ai_messages").delete().eq("conversation_id", convId);
  await supabase.from("ai_conversations").delete().eq("id", convId);
}
console.log("\nisolation done");
