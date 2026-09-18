#!/usr/bin/env node
/** Probe: capture exact console errors + 4xx/5xx requests for the three
 *  pre-existing issues (login React warning, /admin 406, member /dashboard 403).
 *  Reuses the vaulted admin persona + a disposable member persona. */
import fs from "node:fs";
import { chromium } from "playwright";

const env = {};
for (const l of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
const memory = JSON.parse(fs.readFileSync("logs/agent-memory/session-state.json", "utf8"));
const admin = memory.test_account;
async function findDevServer() {
  for (const port of [5173, 5174, 5175]) {
    try { const r = await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(1500) }); if (r.ok) return `http://localhost:${port}`; } catch {}
  }
  throw new Error("No dev server on 5173/5174/5175");
}
const APP = await findDevServer();
const DEVICE_ID = "aqla-agent-device-00000000-0000-4000-8000-000000000001";
const OUT = "logs/browser-validation/error-probe";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { login_console: [], admin_http4xx: [], admin_console: [], member_http4xx: [], member_console: [] };

function wire(page, bucket) {
  page.on("console", async (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    let full = m.text();
    try { for (const a of m.args()) { const v = await a.jsonValue().catch(() => null); if (typeof v === "string" && v.length > full.length) full = v; } } catch {}
    bucket.push(full.slice(0, 1500));
  });
  page.on("response", (r) => {
    if (r.status() >= 400) bucket.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`);
  });
}

async function gotoResilient(page, url) {
  for (let i = 1; i <= 3; i++) {
    try { await page.goto(url, { waitUntil: "commit", timeout: 90000 }); await page.waitForSelector("body", { timeout: 90000 }); return; }
    catch (e) { if (i === 3) throw e; }
  }
}

/* 1) /login anonymous — React hydration warning with component stack */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  wire(page, report.login_console);
  await gotoResilient(page, `${APP}/login`);
  await page.waitForTimeout(6000);
  await ctx.close();
}

/* 2) /admin as admin — find the 406 request URL */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(([d]) => { try { localStorage.setItem("aqla_admin_device_id", d); } catch {} }, [DEVICE_ID]);
  wire(page, report.admin_console);
  report.admin_http4xx = report.admin_console; // share bucket for HTTP lines + console
  await gotoResilient(page, `${APP}/login?passcode=${encodeURIComponent(admin.passcode)}`);
  await page.waitForURL((u) => !String(u).includes("/login"), { timeout: 30000 }).catch(() => {});
  await gotoResilient(page, `${APP}/admin`);
  await page.waitForTimeout(12000);
  await ctx.close();
}

/* 3) fresh member /dashboard — find the 403 request URL */
{
  const stamp = Date.now().toString(36);
  const email = `qa.probe.${stamp}@aqla-test.io`;
  const pass = `Pr${stamp}Xq!`;
  const su = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
    body: JSON.stringify({ email, password: `Pw!${stamp}${Math.random().toString(36).slice(2, 8)}`, email_confirm: true }),
  });
  const suData = await su.json().catch(() => null);
  if (suData?.id) {
    await fetch(`${SUPABASE_URL}/rest/v1/test_accounts`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
      body: JSON.stringify({ id: suData.id, passcode: pass, email, label: "QA probe", role: "user", archetype: "error_probe" }),
    });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.addInitScript(([d]) => { try { localStorage.setItem("aqla_admin_device_id", d); } catch {} }, [DEVICE_ID]);
    wire(page, report.member_console);
    report.member_http4xx = report.member_console;
    await gotoResilient(page, `${APP}/login?passcode=${encodeURIComponent(pass)}`);
    await page.waitForURL((u) => !String(u).includes("/login"), { timeout: 30000 }).catch(() => {});
    await gotoResilient(page, `${APP}/dashboard`);
    await page.waitForTimeout(10000);
    await ctx.close();
    // cleanup
    await fetch(`${SUPABASE_URL}/rest/v1/test_accounts?email=eq.${encodeURIComponent(email)}`, { method: "DELETE", headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${suData.id}`, { method: "DELETE", headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${suData.id}`, { method: "DELETE", headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
  }
}

await browser.close();
fs.writeFileSync(`${OUT}/probe-result.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2).slice(0, 6000));
