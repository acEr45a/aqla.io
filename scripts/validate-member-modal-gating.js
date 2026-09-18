#!/usr/bin/env node
/**
 * validate-member-modal-gating.js — E2E proof for AGENT_NOTEBOOK Entry 019.
 *
 * Phase A (staff persona, vaulted test account):
 *   1. loginWithPasscode sanity check (live aqla-ops).
 *   2. Passcode auto-login via /login?passcode=... on the local dev server.
 *   3. /admin: assert NO member modals mount (ReassessmentPrompt overlay,
 *      "Daily check-in" dialog), and the ops-launcher click LANDS
 *      (aria-label="Open Backend Ops" → panel opens). This click is the one
 *      Entry 018 documented being stolen by the z-70 overlay.
 *   4. /dashboard as staff: same no-member-modal assertion (fix must not be
 *      route-scoped, it is role-scoped).
 *
 * Phase B (member persona, fresh disposable account created via service key):
 *   5. Seed an assessment completed 20 days ago → ReassessmentPrompt MUST
 *      appear on /dashboard (proves gating didn't break real members).
 *   6. Cleanup: delete seeded assessment, test_accounts row, profile, auth user.
 *
 * Artifacts: logs/browser-validation/modal-gating/*.png + result JSON.
 * Exit code 0 iff all assertions pass.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

/* ── env ─────────────────────────────────────────────────────────────── */
const env = {};
for (const l of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !ANON || !SERVICE) {
  console.error("Missing SUPABASE_URL / anon key / service key in .env"); process.exit(2);
}
const DEVICE_ID = "aqla-agent-device-00000000-0000-4000-8000-000000000001";

/* ── memory vault (same as diagnose-admin.js / agent-live-viewer.js) ──── */
const memory = JSON.parse(fs.readFileSync("logs/agent-memory/session-state.json", "utf8"));
const admin = memory.test_account;
if (!admin?.passcode) { console.error("No vaulted test account in logs/agent-memory/session-state.json"); process.exit(2); }

/* ── helpers ──────────────────────────────────────────────────────────── */
const OUT = "logs/browser-validation/modal-gating";
fs.mkdirSync(OUT, { recursive: true });
const result = { started_at: new Date().toISOString(), admin_persona: admin.email, checks: [], console_errors: [], screenshots: [] };
const check = (name, pass, detail = "") => {
  result.checks.push({ name, pass, detail: String(detail).slice(0, 300) });
  console.log(`${pass ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const rest = async (method, table, query, body) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: { "Content-Type": "application/json", apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, Prefer: method === "POST" ? "return=representation" : "return=minimal" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = r.status === 201 || r.headers.get("content-type")?.includes("json") ? await r.json().catch(() => null) : null;
  return { ok: r.ok, status: r.status, data };
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

const MODAL_MARKERS = ["next check-in is ready", "14-day reassessment", "Retake questionnaire", "From your AQLA clinician"];

/** Vite cold-compile tolerant navigation (per agent-live-viewer hardening, Entry 018). */
async function gotoResilient(page, url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: "commit", timeout: 90000 });
      await page.waitForSelector("body", { timeout: 90000 });
      return;
    } catch (e) {
      if (attempt === 3) throw e;
      console.log(`  …nav retry ${attempt} for ${url} (${String(e).slice(0, 80)})`);
    }
  }
}

/* ── Phase A: staff persona ───────────────────────────────────────────── */
const fnRes = await fetch(`${SUPABASE_URL}/functions/v1/aqla-ops`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
  body: JSON.stringify({ action: "loginWithPasscode", passcode: admin.passcode }),
});
const fnData = await fnRes.json().catch(() => ({}));
check("A0 loginWithPasscode (vaulted admin persona)", fnRes.ok && !!fnData.token_hash, `HTTP ${fnRes.status}`);

const APP = await findDevServer();
if (!APP) { console.error("No dev server on 5173/5174/5175 — start one (npm run dev) or logs/start-dev.bat first."); process.exit(2); }
console.log(`Dev server: ${APP}`);

const browser = await chromium.launch({ headless: true });

async function newPersonaPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(([devId]) => { try { window.localStorage.setItem("aqla_admin_device_id", devId); } catch {} }, [DEVICE_ID]);
  page.on("console", (m) => { if (m.type() === "error") result.console_errors.push(`[${page.url().slice(-40)}] ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => result.console_errors.push(`PAGEERROR ${String(e).slice(0, 200)}`));
  return { ctx, page };
}

async function assertNoMemberModals(page, where) {
  const overlay = await page.evaluate(() => {
    const els = document.querySelectorAll("div.fixed.inset-0.z-\\[70\\]");
    return els.length;
  });
  check(`${where} no z-70 member overlay mounted`, overlay === 0, `found=${overlay}`);
  const body = await page.locator("body").innerText();
  const marker = MODAL_MARKERS.find((m) => body.toLowerCase().includes(m.toLowerCase()));
  check(`${where} no member-modal text present`, !marker, marker ? `matched "${marker}"` : "clean");
}

if (fnData.token_hash) {
  const { ctx, page } = await newPersonaPage();

  // A1: passcode auto-login
  await page.goto(`${APP}/login?passcode=${encodeURIComponent(admin.passcode)}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL((u) => !String(u).includes("/login"), { timeout: 30000 }).catch(() => {});
  const loggedIn = !String(page.url()).includes("/login");
  check("A1 passcode auto-login redirects out of /login", loggedIn, page.url());
  await page.screenshot({ path: `${OUT}/A1-after-login.png`, fullPage: true }).catch(() => {});
  result.screenshots.push("A1-after-login.png");

  // A2: /admin — the exact scenario from Entry 018 Finding 2
  await gotoResilient(page, `${APP}/admin`);
  await page.waitForTimeout(9000); // let modals (if any) mount + admin data load
  check("A2a still on /admin (guard passed)", page.url().includes("/admin"), page.url());
  await assertNoMemberModals(page, "A2b /admin");
  await page.screenshot({ path: `${OUT}/A2-admin-clean.png`, fullPage: true }).catch(() => {});
  result.screenshots.push("A2-admin-clean.png");

  // A3: ops-launcher click LANDS (Entry 018's failing click)
  const launcher = page.locator('[aria-label="Open Backend Ops"]');
  const visible = await launcher.isVisible().catch(() => false);
  check("A3a ops-launcher visible on /admin", visible);
  if (visible) {
    await launcher.click();
    await page.waitForTimeout(2500);
    const panelText = await page.locator("body").innerText();
    const opened = /Backend Ops/i.test(panelText) && (await page.locator("form input").count()) > 0; // composer is a plain <input> (no type attr) inside the panel form
    check("A3b ops panel OPENS after click", opened, "launcher click landed, panel input present");
    await page.screenshot({ path: `${OUT}/A3-ops-panel-open.png`, fullPage: true }).catch(() => {});
    result.screenshots.push("A3-ops-panel-open.png");
  }

  // A4: staff on a member route — role-scoped, not route-scoped
  await gotoResilient(page, `${APP}/dashboard`);
  await page.waitForTimeout(6000);
  await assertNoMemberModals(page, "A4 /dashboard(staff)");
  await ctx.close();
} else {
  console.log("Skipping Phase A browser steps — login failed.");
}

/* ── Phase B: member persona (fresh disposable account) ───────────────── */
const stamp = Date.now().toString(36);
const memEmail = `qa.member.${stamp}@aqla-test.io`;
const memPass = `Mem${stamp}Xq!`;
let seededAssessmentId = null;
let memberUserId = null;

try {
  // B0: create auth user (service role)
  const su = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
    body: JSON.stringify({ email: memEmail, password: `Pw!${stamp}${Math.random().toString(36).slice(2, 8)}`, email_confirm: true }),
  });
  const suData = await su.json().catch(() => null);
  check("B0 create member auth user", su.ok && !!suData?.id, su.ok ? memEmail : `HTTP ${su.status}`);
  memberUserId = suData?.id;

  if (memberUserId) {
    // profile (role user) + test_accounts registration
    const profIns = await rest("POST", "profiles", "", { id: memberUserId, email: memEmail, role: "user", is_test_account: true });
    // 409 = profile auto-created by the handle_new_user DB trigger on signup — expected, not an error
    check("B0b member profile exists (created or DB-triggered)", profIns.ok || profIns.status === 409, profIns.ok ? "inserted" : `HTTP ${profIns.status} (trigger auto-created)`);
    // test_accounts.id IS the FK to auth.users (ON DELETE CASCADE) — must supply it
    const taIns = await rest("POST", "test_accounts", "", { id: memberUserId, passcode: memPass, email: memEmail, label: "QA member gating", role: "user", archetype: "modal_gating_qa" });
    check("B0c register test_accounts row", taIns.ok, taIns.ok ? "" : `HTTP ${taIns.status} ${JSON.stringify(taIns.data).slice(0, 160)}`);
    if (!taIns.ok) throw new Error("test_accounts insert failed — cannot continue member phase");

    // B1: login as member (magic-link verifyOtp with the passcode token)
    const lr = await fetch(`${SUPABASE_URL}/functions/v1/aqla-ops`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ action: "loginWithPasscode", passcode: memPass }),
    });
    const ld = await lr.json().catch(() => ({}));
    check("B1 member loginWithPasscode", lr.ok && !!ld.token_hash, `HTTP ${lr.status}`);

    // B2: seed assessment completed 20 days ago
    const stale = new Date(Date.now() - 20 * 864e5).toISOString();
    const ins = await rest("POST", "assessments", "", { created_by_id: memberUserId, responses: { seeded_by: "modal-gating-validation" }, completed_date: stale });
    seededAssessmentId = Array.isArray(ins.data) ? ins.data[0]?.id : ins.data?.id ?? null;
    check("B2 seed stale assessment (20d)", ins.ok && !!seededAssessmentId, ins.ok ? `completed ${stale.slice(0, 10)}` : `HTTP ${ins.status} ${JSON.stringify(ins.data).slice(0, 160)}`);
    if (!ins.ok || !seededAssessmentId) throw new Error("assessment seed failed — cannot validate member modal");

    if (ld.token_hash && ins.ok) {
      const { ctx, page } = await newPersonaPage();
      // auto-login via /login?passcode= (Login.jsx handles agent_passcode/passcode)
      await gotoResilient(page, `${APP}/login?passcode=${encodeURIComponent(memPass)}`);
      await page.waitForURL((u) => !String(u).includes("/login"), { timeout: 30000 }).catch(() => {});
      const memberIn = !String(page.url()).includes("/login");
      check("B3 member auto-login", memberIn, page.url());

      await gotoResilient(page, `${APP}/dashboard`);
      await page.waitForTimeout(8000);
      const body = await page.locator("body").innerText();
      const modalShown = /next check-in is ready|14-day reassessment/i.test(body);
      check("B4 member SEES ReassessmentPrompt (gating did not break members)", modalShown);
      await page.screenshot({ path: `${OUT}/B4-member-modal-shown.png`, fullPage: true }).catch(() => {});
      result.screenshots.push("B4-member-modal-shown.png");
      await ctx.close();
    }
  }
} catch (e) {
  check("Phase B execution", false, String(e).slice(0, 200));
} finally {
  // Cleanup: seeded assessment, test_accounts row, profile, auth user
  if (seededAssessmentId) { const d = await rest("DELETE", "assessments", `?id=eq.${seededAssessmentId}`); check("cleanup seeded assessment", d.ok); }
  if (memberUserId) {
    await rest("DELETE", "test_accounts", `?email=eq.${encodeURIComponent(memEmail)}`).then((d) => check("cleanup test_accounts row", d.ok));
    await rest("DELETE", "profiles", `?id=eq.${memberUserId}`).then((d) => check("cleanup profile", d.ok));
    const du = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${memberUserId}`, { method: "DELETE", headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
    check("cleanup auth user", du.ok || du.status === 404, `HTTP ${du.status}`);
  }
}

await browser.close();

/* ── report ───────────────────────────────────────────────────────────── */
result.finished_at = new Date().toISOString();
result.passed = result.checks.filter((c) => c.pass).length;
result.failed = result.checks.filter((c) => !c.pass).length;
result.console_error_count = result.console_errors.length;
fs.writeFileSync(`${OUT}/result.json`, JSON.stringify(result, null, 2));
console.log(`\n=== ${result.passed} passed / ${result.failed} failed / ${result.console_error_count} console errors ===`);
console.log(`Artifacts: ${OUT}/ (result.json + ${result.screenshots.length} screenshots)`);
process.exit(result.failed === 0 ? 0 : 1);
