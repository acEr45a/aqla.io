/**
 * Browser E2E: the clinician MemberProfilePanel "AQLA Clinical Summary" must execute
 * through the live OpenRouter medical route (inclusionai/ling-3.0-flash-sante:free).
 *
 * Flow: passcode auto-login -> /clinician -> open first member -> summary auto-runs
 *       -> bullets render -> definitive proof from ai_runs (newest dynamic_worker row
 *       created during this test must carry the Sante model).
 *
 * Side-effect hygiene: if the summary auto-flagged itself into clinical_flags, the
 * created row is deleted (best effort) so no production noise remains.
 *
 * Usage: node scripts/verify-clinician-sante-browser.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(process.cwd());
const envText = fs.existsSync(path.join(root, ".env")) ? fs.readFileSync(path.join(root, ".env"), "utf8") : "";
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON) { console.error("Missing Supabase URL/anon key"); process.exit(1); }

const memory = JSON.parse(fs.readFileSync(path.join(root, "logs/agent-memory/session-state.json"), "utf8"));
const passcode = memory.test_account?.passcode;
if (!passcode) { console.error("No vaulted admin passcode"); process.exit(1); }

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? ` — ${extra}` : ""}`);
  ok ? pass++ : fail++;
};

async function findDevServer() {
  for (const port of [5173, 5174, 5175]) {
    try {
      const r = await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return `http://localhost:${port}`;
    } catch { /* next */ }
  }
  return null;
}

const APP = await findDevServer();
if (!APP) { console.error("No dev server on 5173-5175"); process.exit(1); }
console.log(`Dev server: ${APP}`);
const testStartIso = new Date().toISOString();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160)); });
page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR ${String(e).slice(0, 160)}`));

// A1: passcode auto-login (Vite cold-compile tolerant)
let loggedIn = false;
for (let attempt = 1; attempt <= 3 && !loggedIn; attempt++) {
  try {
    await page.goto(`${APP}/login?passcode=${encodeURIComponent(passcode)}`, { waitUntil: "commit", timeout: 90000 });
    await page.waitForURL((u) => !String(u).includes("/login"), { timeout: 60000 });
    loggedIn = true;
  } catch (e) {
    console.log(`  …login retry ${attempt} (${String(e).slice(0, 80)})`);
  }
}
check("A1 passcode auto-login", loggedIn, page.url());

// A2: clinician console renders with member rows
await page.goto(`${APP}/clinician`, { waitUntil: "commit", timeout: 90000 });
await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
// Default tab is "inbox" — switch to the Members tab to reach the directory.
const membersTab = page.getByRole("button", { name: "Members", exact: true });
await membersTab.first().click({ timeout: 30000 });
check("A2 /clinician rendered + Members tab opened", true, page.url());

// A3: open the first member; summary auto-runs; bullets must render (Sante ~6-12s)
// Member cards are button.aqla-panel.text-left in the directory grid (Clinician.jsx).
await page.waitForSelector("button.aqla-panel.text-left, :text('No members found.')", { timeout: 30000 });
const noMembers = await page.locator(":text('No members found.')").count();
if (noMembers > 0) {
  check("A3 member row clicked", false, "directory has no members — seed one before running this test");
  await browser.close();
  process.exit(1);
} else {
  const memberCard = page.locator("button.aqla-panel.text-left").first();
  const cardName = ((await memberCard.locator("p").first().textContent()) || "").trim();
  await memberCard.click();
  check("A3 member row clicked", true, cardName);
}

const bullets = page.locator("li:has(span.bg-primary)");
try {
  await bullets.first().waitFor({ timeout: 75000 });
  const n = await bullets.count();
  check("A4 clinical summary bullets rendered", n >= 1, `${n} bullet(s)`);
} catch {
  check("A4 clinical summary bullets rendered", false, "timed out after 75s");
}

// A5: definitive routing proof from ai_runs (newest rows in test window).
// ai_runs is RLS-guarded: the read needs an authenticated session, so mint one via
// the vaulted passcode (same pattern as verify-medical-model-e2e.mjs).
const supabase = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
let authed = supabase;
try {
  const fnRes = await fetch(`${SUPABASE_URL}/functions/v1/aqla-ops`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ action: "loginWithPasscode", passcode }),
  });
  const { token_hash } = await fnRes.json();
  const { data: otp } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash, options: { type: "magiclink" } });
  if (otp?.session?.access_token) {
    authed = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${otp.session.access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
} catch { /* fall back to anon client — A5 will report honestly */ }
const { data: run } = await authed
  .from("ai_runs")
  .select("worker_id, model, status, latency_ms, created_at")
  .gte("created_at", testStartIso)
  .order("created_at", { ascending: false })
  .limit(5);
const santeRun = (run || []).find((r) => (r.model || "").includes("ling-3.0-flash-sante"));
check(
  "A5 ai_runs proof of Sante routing",
  !!santeRun,
  santeRun ? `${santeRun.worker_id} model=${santeRun.model} status=${santeRun.status} ${santeRun.latency_ms}ms` : `rows seen: ${JSON.stringify((run || []).map((r) => ({ w: r.worker_id, m: r.model })))}`
);

// Cleanup: remove the auto-flag created by this test run (if any), best effort.
let flagDeleted = "skipped";
try {
  const del = await supabase
    .from("clinical_flags")
    .delete()
    .eq("source_agent", "clinician_summary")
    .gte("created_at", testStartIso)
    .select("id");
  flagDeleted = del.error ? `failed (${del.error.message.slice(0, 60)})` : `${(del.data || []).length} row(s)`;
} catch (e) {
  flagDeleted = `failed (${String(e).slice(0, 60)})`;
}
console.log(`cleanup: auto clinical_flags in test window → ${flagDeleted} (RLS may legitimately deny; report only)`);

const relevantErrors = consoleErrors.filter((e) => !/React Router|GPU|WebGL/i.test(e));
check("console errors (app-level)", relevantErrors.length === 0, relevantErrors.slice(0, 3).join(" | "));

await page.screenshot({ path: "logs/browser-validation/clinician-sante/panel.png", fullPage: false }).catch(() => {});
await browser.close();

console.log(`\n${pass} passed / ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
