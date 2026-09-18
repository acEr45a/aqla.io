/**
 * One-off end-to-end verification that AI chat works after setting
 * VERCEL_AI_GATEWAY_KEY in Supabase secrets.
 *
 * Flow: aqla-ops loginWithPasscode -> verifyOtp -> create ai_conversations row
 *       -> agent-message -> assert reply is a real AI response (not the
 *       hardcoded fallback string from apiClient.js line ~541).
 *
 * Usage: node scripts/verify-ai-chat.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(process.cwd());
let envText = "";
for (const candidate of [path.join(root, ".env")]) {
  if (fs.existsSync(candidate)) envText = fs.readFileSync(candidate, "utf8");
}
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL_PROD;
if (!SUPABASE_URL) { console.error("No VITE_SUPABASE_URL in .env"); process.exit(1); }
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
if (!ANON_KEY) { console.error("No VITE_SUPABASE_ANON_KEY in .env"); process.exit(1); }

const memory = JSON.parse(fs.readFileSync(path.join(root, "logs/agent-memory/session-state.json"), "utf8"));
const passcode = memory.test_account?.passcode;
if (!passcode) { console.error("No vaulted test passcode"); process.exit(1); }
console.log(`Using vaulted test account: ${memory.test_account.email} (role=${memory.test_account.role})`);

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 1) loginWithPasscode -> token_hash
const fn = async (name, body, token) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
  return { status: res.status, data };
};

const login = await fn("aqla-ops", { action: "loginWithPasscode", passcode });
if (login.status !== 200 || !login.data?.token_hash) {
  console.error("loginWithPasscode failed:", login.status, login.data);
  process.exit(1);
}
console.log("✓ loginWithPasscode OK (token_hash received)");

// 2) verifyOtp -> real session
const { data: otpData, error: otpErr } = await supabase.auth.verifyOtp({
  type: "magiclink",
  token_hash: login.data.token_hash,
  options: { type: "magiclink" },
});
if (otpErr || !otpData?.session?.access_token) {
  console.error("verifyOtp failed:", otpErr?.message || otpData);
  process.exit(1);
}
const token = otpData.session.access_token;
console.log("✓ verifyOtp OK (real session obtained)");

// 3) create conversation via agents.createConversation logic (same shape as apiClient)
const convId = crypto.randomUUID();
const { error: convErr } = await supabase.from("ai_conversations").insert([
  { id: convId, user_id: otpData.user.id, agent_name: "help_agent", metadata: {} },
]);
if (convErr) {
  console.error("ai_conversations insert failed:", convErr.message);
  process.exit(1);
}
console.log(`✓ conversation created: ${convId}`);

// 4) agent-message call
const t0 = Date.now();
const reply = await fn("agent-message", {
  conversation_id: convId,
  message: { role: "user", content: "What is the psychomotor vigilance task used for on this platform? Answer in one short sentence." },
}, token);
const dt = Date.now() - t0;
console.log(`agent-message HTTP ${reply.status} (${dt}ms)`);
if (reply.status !== 200) {
  console.error("agent-message failed:", JSON.stringify(reply.data).slice(0, 400));
  process.exit(1);
}

const content = reply.data?.content || reply.data?.message?.content || "";
console.log("── reply ──");
console.log(content.slice(0, 500));
console.log("───────────");

const FALLBACK = "How else can I assist with your cognitive protocols?";
const isFallback = content.includes(FALLBACK) || content.trim() === "";
if (isFallback) {
  console.error("✗ FAIL: reply is the hardcoded fallback or empty");
  process.exit(1);
}
console.log("✓ PASS: real AI reply received (not the hardcoded fallback)");
console.log(`model=${reply.data?.model || "?"} tool_calls=${Array.isArray(reply.data?.tool_calls) ? reply.data.tool_calls.length : 0}`);

// 5) cleanup: delete the test conversation + messages
const delMsgs = await supabase.from("ai_messages").delete().eq("conversation_id", convId);
const delConv = await supabase.from("ai_conversations").delete().eq("id", convId);
console.log(`cleanup: messages=${delMsgs.error ? "err" : "ok"} conversation=${delConv.error ? "err" : "ok"}`);
