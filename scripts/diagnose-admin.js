#!/usr/bin/env node
/** One-off /admin diagnostic — dumps rendered text, screenshot, console & failed requests. */
import fs from "node:fs";
import { chromium } from "playwright";

const env = {};
for (const l of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
const DEVICE_ID = "aqla-agent-device-00000000-0000-4000-8000-000000000001";

const memory = JSON.parse(fs.readFileSync("logs/agent-memory/session-state.json", "utf8"));
const { email, passcode } = memory.test_account;
console.log("Persona:", email, passcode);

const res = await fetch(`${SUPABASE_URL}/functions/v1/aqla-ops`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` },
  body: JSON.stringify({ action: "loginWithPasscode", passcode }),
});
const login = await res.json();
if (!login.token_hash) { console.error("loginWithPasscode failed:", login); process.exit(1); }

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.addInitScript(([devId]) => {
  try { window.localStorage.setItem("aqla_admin_device_id", devId); } catch {}
}, [DEVICE_ID]);

const consoleLogs = [];
page.on("console", (m) => consoleLogs.push(`[${m.type()}] ${m.text().slice(0, 220)}`));
const failed = [];
page.on("requestfailed", (r) => failed.push(`${r.method()} ${r.url().slice(0, 120)} :: ${r.failure()?.errorText}`));
page.on("response", (r) => { if (r.status() >= 400) failed.push(`HTTP ${r.status()} ${r.url().slice(0, 120)}`); });

await page.goto(`http://localhost:5174/login?passcode=${passcode}`, { waitUntil: "domcontentloaded" });
await page.waitForURL((u) => !String(u).includes("/login"), { timeout: 25000 }).catch(() => {});
console.log("After login URL:", page.url());

await page.goto("http://localhost:5174/admin", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(15000);
console.log("Final URL:", page.url());
console.log("--- BODY TEXT (first 1200 chars) ---");
console.log((await page.locator("body").innerText()).slice(0, 1200));
await page.screenshot({ path: "logs/browser-validation/admin-diag.png", fullPage: true });
console.log("--- CONSOLE (last 25) ---");
console.log(consoleLogs.slice(-25).join("\n"));
console.log("--- FAILED REQUESTS ---");
console.log(failed.slice(-20).join("\n") || "(none)");

// Is the session's profile actually admin?
const sess = await page.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
      try { return JSON.parse(localStorage.getItem(k))?.user?.id; } catch {}
    }
  }
  return null;
});
const pr = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${sess}&select=id,role,is_test_account,admin_trusted_devices`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
console.log("--- PROFILE NOW ---", JSON.stringify(await pr.json()));

await browser.close();
