/**
 * Probe: can an authenticated clinician/admin read member profiles (role='user')?
 * Determines whether the Clinician directory drift fix can list members via RLS
 * or whether RLS blocks it. Uses the vaulted admin persona.
 * Usage: node scripts/probe-profiles-rls.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envText = fs.readFileSync(path.join(root, ".env"), "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const memory = JSON.parse(fs.readFileSync(path.join(root, "logs/agent-memory/session-state.json"), "utf8"));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const login = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/aqla-ops`, {
  method: "POST", headers: { "Content-Type": "application/json", apikey: env.VITE_SUPABASE_ANON_KEY },
  body: JSON.stringify({ action: "loginWithPasscode", passcode: memory.test_account.passcode }),
});
const { token_hash } = await login.json();
const { data: otp } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash, options: { type: "magiclink" } });
const authed = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${otp.session.access_token}` } },
  auth: { persistSession: false, autoRefreshToken: false },
});

const all = await authed.from("profiles").select("id, full_name, email, role").limit(20);
console.log("profiles read as admin:", all.error ? `BLOCKED (${all.error.message})` : `${(all.data || []).length} row(s)`);
if (!all.error) {
  const members = (all.data || []).filter((p) => p.role === "user");
  console.log("role='user' rows:", members.length, members.slice(0, 3).map((m) => m.email || m.id));
}
const byRole = await authed.from("profiles").select("id, role").eq("role", "user");
console.log("filtered role=user read:", byRole.error ? `BLOCKED (${byRole.error.message})` : `${(byRole.data || []).length} row(s)`);
