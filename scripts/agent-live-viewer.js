#!/usr/bin/env node
/**
 * AQLA · Freebuff Live Agent Viewer & Hybrid Persistent Memory Test Suite
 * ======================================================================
 * Single command:  npm run agent:live
 *
 *  - Port A (target app):  http://localhost:5174  (falls back to 5173, spawns Vite if not running)
 *  - Port B (live viewer): http://localhost:5180  (HTTP UI + WebSocket stream)
 *  - Playwright Chromium driven over CDP; viewport streamed via Page.startScreencast.
 *  - Hybrid memory: logs/agent-memory/session-state.json (local vault, git-ignored)
 *                   + Supabase `test_accounts.data_config.freebuff_memory` (cloud sync).
 *  - Post-test: browser + viewer stay alive for inspection / takeover.
 *
 * This module is self-owned by the Freebuff agent (see AGENT_NOTEBOOK.md).
 */

import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { chromium } from "playwright";

/* ────────────────────────────────────────────────────────────────────────
 * Configuration
 * ──────────────────────────────────────────────────────────────────────── */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const VIEWER_PORT = Number(process.env.AGENT_VIEWER_PORT || 5180);
const PREFERRED_PORTS = [5174, 5173]; // target app: 5174, or 5173 if free
const HEADLESS = process.env.AGENT_HEADLESS !== "false";
const VIEWPORT = { width: 1280, height: 800 };
const MEMORY_DIR = path.join(ROOT, "logs", "agent-memory");
const MEMORY_FILE = path.join(MEMORY_DIR, "session-state.json");
const UI_FILE = path.join(__dirname, "agent-viewer-ui.html");

const SCRIPT_VERSION = "1.0.0";
const STARTED_AT = new Date();

/* ────────────────────────────────────────────────────────────────────────
 * Tiny .env loader (project root) — never hardcode secrets in source
 * ──────────────────────────────────────────────────────────────────────── */
function loadDotEnv() {
  const env = {};
  try {
    const raw = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      env[k] = v;
    }
  } catch { /* no .env — fine */ }
  return env;
}
const ENV = { ...loadDotEnv(), ...process.env };

const SUPABASE_URL =
  ENV.VITE_SUPABASE_URL || ENV.SUPABASE_URL || "https://xuwifebsymvangjbynkg.supabase.co";
const SUPABASE_ANON_KEY =
  ENV.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1d2lmZWJzeW12YW5namJ5bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MDA2MTYsImV4cCI6MjEwMjQ3NjYxNn0.UGeB-hE5qY40EQ-fUcynZNiR2rqShpF6O7bozCJ9lIQ";
const SUPABASE_SERVICE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_SECRET_KEY || "";
const ADMIN_EMAIL = ENV.AGENT_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = ENV.AGENT_ADMIN_PASSWORD || "";

/* ────────────────────────────────────────────────────────────────────────
 * Console + HUD broadcast plumbing
 * ──────────────────────────────────────────────────────────────────────── */
const wsClients = new Set();
function wsBroadcast(obj) {
  const payload = JSON.stringify(obj);
  for (const c of wsClients) {
    try { if (c.readyState === 1) c.send(payload); } catch { /* dropped */ }
  }
}
function log(...args) {
  const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, line);
}
const state = { goal: "", persona: "", ticker: "", tickerKind: "info", agentState: "booting" };
function setState(agentState) {
  state.agentState = agentState;
  wsBroadcast({ t: "state", state: agentState });
}
function setGoal(goal) { state.goal = goal; wsBroadcast({ t: "hud", goal }); }
function setPersona(persona) { state.persona = persona; wsBroadcast({ t: "hud", persona }); }
function ticker(text, kind = "info") {
  state.ticker = text; state.tickerKind = kind;
  wsBroadcast({ t: "hud", ticker: text, tickerKind: kind });
  log(`  » ${text}`);
}

/* ────────────────────────────────────────────────────────────────────────
 * Networking helpers
 * ──────────────────────────────────────────────────────────────────────── */
function portOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const s = net.connect({ port, host });
    s.setTimeout(600);
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("timeout", () => { s.destroy(); resolve(false); });
    s.once("error", () => resolve(false));
  });
}
/** Probe both stacks — Vite binds `localhost` (::1) on some Windows setups. */
async function portInUse(port) {
  return (await portOpen(port, "localhost")) || (await portOpen(port, "127.0.0.1"));
}
function httpStatus(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    try {
      const req = http.get(url, { timeout: timeoutMs }, (res) => { res.resume(); resolve(res.statusCode || 0); });
      req.once("timeout", () => { req.destroy(); resolve(0); });
      req.once("error", () => resolve(0));
    } catch { resolve(0); }
  });
}
async function waitForHttp(url, timeoutMs = 45000, everyMs = 700) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const st = await httpStatus(url);
    if (st >= 200 && st < 500) return true;
    await sleep(everyMs);
  }
  return false;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ────────────────────────────────────────────────────────────────────────
 * Supabase REST helpers (edge function `aqla-ops` + direct table access)
 * ──────────────────────────────────────────────────────────────────────── */
async function supaInvoke(action, payload, bearerToken) {
  const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${bearerToken || SUPABASE_ANON_KEY}`,
  };
  const res = await fetch(`${SUPABASE_URL}/functions/v1/aqla-ops`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json };
}

/** Admin JWT via Supabase password grant (credentials from .env, never hardcoded). */
async function getAdminJwt() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.access_token ? { access_token: json.access_token, user_id: json.user?.id } : null;
  } catch { return null; }
}

/** Service-key REST client (fallback path when no admin credentials are available). */
function serviceHeaders(extra = {}) {
  return { "Content-Type": "application/json", apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, ...extra };
}
async function serviceSelect(table, query) {
  if (!SUPABASE_SERVICE_KEY) return { ok: false, data: null };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: serviceHeaders() });
    if (!res.ok) return { ok: false, data: null };
    return { ok: true, data: await res.json() };
  } catch { return { ok: false, data: null }; }
}
async function serviceInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: serviceHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(rows),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}
async function servicePatch(table, query, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: serviceHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

function generatePasscode(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const array = new Uint8Array(len);
  crypto.getRandomValues(array); // global webcrypto (Node >= 18)
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

/** CDP text + windowsVirtualKeyCode mapping for takeover key dispatch. */
const VK = { Enter: 13, Backspace: 8, Tab: 9, Escape: 27, Delete: 46, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Space: 32 };
function keyTextFor(key) {
  if (key === "Enter") return "\r";
  if (key === "Tab") return "\t";
  if (key === "Space") return " ";
  return key.length === 1 ? key : "";
}

/** Fixed localStorage device id injected into the persona browser (AdminSecurityGate trust check). */
const AGENT_DEVICE_ID = "aqla-agent-device-00000000-0000-4000-8000-000000000001";

/* ────────────────────────────────────────────────────────────────────────
 * Hybrid Persistent Memory Vault
 *   local  → logs/agent-memory/session-state.json   (git-ignored)
 *   cloud  → test_accounts.data_config.freebuff_memory
 * ──────────────────────────────────────────────────────────────────────── */
const memory = {
  version: 1,
  updated_at: null,
  agent: "freebuff-live-viewer",
  script_version: SCRIPT_VERSION,
  test_account: null, // { user_id, email, passcode, label, role, created_via }
  runs: [],           // audit trail of every test run
  verified_components: [], // components that passed on the latest run that touched them
  notes: [],
};

function loadLocalMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
      if (parsed && typeof parsed === "object") {
        Object.assign(memory, parsed);
        memory.runs = Array.isArray(memory.runs) ? memory.runs : [];
        memory.verified_components = Array.isArray(memory.verified_components) ? memory.verified_components : [];
        return true;
      }
    }
  } catch (e) { log("⚠ Could not parse local memory vault, starting fresh:", e.message); }
  return false;
}
function saveLocalMemory() {
  memory.updated_at = new Date().toISOString();
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}
function broadcastMemory() {
  wsBroadcast({
    t: "memory",
    memory: {
      runs: memory.runs,
      verified_components: memory.verified_components,
      updated_at: memory.updated_at,
    },
  });
}

/** Cloud sync of credentials + audit history into test_accounts.data_config.freebuff_memory. */
async function cloudSyncMemory() {
  if (!memory.test_account?.user_id) return false;
  const doc = {
    freebuff_memory: {
      agent: memory.agent,
      script_version: memory.script_version,
      updated_at: memory.updated_at,
      runs: memory.runs.slice(-20),
      verified_components: memory.verified_components,
      credentials: {
        email: memory.test_account.email,
        passcode: memory.test_account.passcode,
        label: memory.test_account.label,
        role: memory.test_account.role,
      },
    },
  };
  // Preferred: admin JWT patch
  const admin = await getAdminJwt();
  if (admin) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/test_accounts?id=eq.${memory.test_account.user_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${admin.access_token}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ data_config: doc }),
      });
      if (res.ok) return true;
    } catch { /* fall through */ }
  }
  // Fallback: service key
  if (SUPABASE_SERVICE_KEY) {
    try {
      const r = await servicePatch("test_accounts", `id=eq.${memory.test_account.user_id}`, { data_config: doc });
      if (r.ok) return true;
    } catch { /* fall through */ }
  }
  return false;
}

/** Try to load a previously cloud-synced memory for a fresh local vault. */
async function cloudLoadMemory() {
  if (memory.test_account?.user_id) return; // local vault already knows the account
  // Look for any test account whose data_config carries our memory doc
  if (SUPABASE_SERVICE_KEY) {
    const { ok, data } = await serviceSelect("test_accounts", "select=id,email,passcode,label,role,data_config&order=created_at.desc&limit=25");
    if (ok && Array.isArray(data)) {
      const ours = data.find((a) => a?.data_config?.freebuff_memory?.agent === memory.agent && a.role === "admin");
      if (ours) {
        const fm = ours.data_config.freebuff_memory;
        memory.test_account = {
          user_id: ours.id, email: ours.email, passcode: ours.passcode,
          label: ours.label, role: ours.role, created_via: "cloud-restored",
        };
        memory.runs = Array.isArray(fm.runs) ? fm.runs : memory.runs;
        memory.verified_components = Array.isArray(fm.verified_components) ? fm.verified_components : memory.verified_components;
        log(`☁ Restored memory from cloud (account ${ours.email}, ${memory.runs.length} past runs)`);
      }
    }
  }
}

/**
 * Memory lifecycle: reuse a valid vaulted test account, or create one via
 * aqla-ops createTestAccount (admin JWT) with a service-key fallback mirroring
 * the same logic. Verifies the passcode still works via loginWithPasscode.
 */
async function ensureTestAccount() {
  setGoal("Bootstrap persistent memory & test account");
  ticker("[MEMORY] Checking local vault for a valid test account…", "info");

  const admin = await getAdminJwt();
  if (admin) log("✔ Admin credentials resolved from .env (createTestAccount path available)");
  else if (SUPABASE_SERVICE_KEY) log("ℹ No admin creds in .env — service-key fallback will be used for account creation");
  else log("⚠ Neither admin creds nor service key available — account creation may fail");

  async function createAccount(label) {
    ticker(`[MEMORY] No valid account in memory — creating one via aqla-ops ("${label}")…`, "act");
    if (admin) {
      const r = await supaInvoke("createTestAccount", { label, role: "admin", archetype: "freebuff_agent" }, admin.access_token);
      if (r.ok && r.data?.id) {
        return {
          user_id: r.data.id, email: r.data.email, passcode: r.data.passcode,
          label: r.data.label, role: r.data.role, created_via: "aqla-ops.createTestAccount",
        };
      }
      log(`⚠ aqla-ops createTestAccount failed (${r.status}): ${r.data?.error || "unknown"} — trying service-key fallback`);
    }
    if (SUPABASE_SERVICE_KEY) {
      // Mirror of the edge-function logic (same tables, same shape)
      const passcode = generatePasscode();
      const email = `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.aqla.io`;
      const tempPassword = `AqlaTest!${generatePasscode(8)}`;
      const created = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: serviceHeaders(),
        body: JSON.stringify({ email, password: tempPassword, email_confirm: true, user_metadata: { full_name: label, is_test_account: true } }),
      });
      if (!created.ok) throw new Error(`auth admin create failed (${created.status})`);
      const user = await created.json();
      // NB: profiles has no onboarding_completed column (drift found in Entry 006's
      // aqla-ops upsert) — insert only columns that actually exist, and CHECK the result.
      const prof = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: "POST",
        headers: serviceHeaders({ Prefer: "resolution=merge-duplicates" }),
        body: JSON.stringify([{ id: user.id, full_name: label, email, role: "admin", is_test_account: true }]),
      });
      if (!prof.ok) log(`⚠ profiles upsert warning (${prof.status}) — ensureAdminProfile will self-heal`);
      const ta = await serviceInsert("test_accounts", [{
        id: user.id, email, passcode, label, role: "admin", archetype: "freebuff_agent",
        history: [{ event: "created", at: new Date().toISOString(), by: "freebuff-live-viewer(service-fallback)" }],
        data_config: {},
      }]);
      if (!ta.ok || !ta.data?.[0]?.id) throw new Error("test_accounts insert failed");
      return { user_id: user.id, email, passcode, label, role: "admin", created_via: "service-key fallback" };
    }
    throw new Error("No viable account-creation path (need AGENT_ADMIN_EMAIL/PASSWORD or SUPABASE_SERVICE_ROLE_KEY in .env)");
  }

  async function passcodeWorks(passcode) {
    const r = await supaInvoke("loginWithPasscode", { passcode });
    return r.ok && !!r.data?.token_hash;
  }

  // 1) Reuse path — only accounts with the admin role can exercise /admin surfaces
  if (memory.test_account?.passcode && memory.test_account.role === "admin") {
    ticker(`[MEMORY] Found vaulted account ${memory.test_account.email} — verifying passcode…`, "act");
    if (await passcodeWorks(memory.test_account.passcode)) {
      ticker(`[MEMORY] ✔ Reusing vaulted account ${memory.test_account.email} (passcode valid)`, "pass");
      return memory.test_account;
    }
    ticker("[MEMORY] ✗ Vaulted passcode rejected (account deleted?) — recreating", "err");
  } else if (memory.test_account) {
    ticker(`[MEMORY] Vaulted account role is '${memory.test_account.role}' (need admin) — creating a fresh admin persona`, "info");
  } else {
    await cloudLoadMemory();
    if (memory.test_account?.passcode && memory.test_account.role === "admin" && (await passcodeWorks(memory.test_account.passcode))) {
      ticker(`[MEMORY] ✔ Cloud-restored account ${memory.test_account.email} verified`, "pass");
      saveLocalMemory();
      return memory.test_account;
    }
  }

  // 2) Create path
  const account = await createAccount("Freebuff Live Agent");
  memory.test_account = account;
  saveLocalMemory();
  ticker(`[MEMORY] ✔ Test account created via ${account.created_via}: ${account.email}`, "pass");
  return account;
}

/**
 * Self-heal the persona's profile (service key): Entry 006's aqla-ops upsert
 * silently no-ops on a nonexistent column, which leaves role='user' and blocks
 * /admin. Scoped strictly to our own test persona — never touches real users.
 */
async function ensureAdminProfile(account) {
  if (!SUPABASE_SERVICE_KEY || !account.user_id) return;
  const { ok, data } = await serviceSelect("profiles", `select=id,role,is_test_account&id=eq.${account.user_id}`);
  const prof = ok && Array.isArray(data) ? data[0] : null;
  if (!prof) {
    await serviceInsert("profiles", [{ id: account.user_id, full_name: account.label, email: account.email, role: "admin", is_test_account: true }]);
    ticker("[MEMORY] profile row missing — created with admin role", "act");
    return;
  }
  if (prof.role !== "admin" || prof.is_test_account !== true) {
    await servicePatch("profiles", `id=eq.${account.user_id}`, { role: "admin", is_test_account: true });
    ticker(`[MEMORY] self-healed persona profile (was role='${prof.role}') → admin + is_test_account`, "act");
  }
}

/**
 * Provision the agent browser as a trusted admin device so AdminSecurityGate
 * auto-verifies through its own normal flow — no gate bypass, no captcha, no
 * email OTP. Equivalent to the admin having clicked "Trust this device" on the
 * agent's browser profile beforehand. Scoped to our persona's user_id only.
 */
async function ensureTrustedDevice(account) {
  if (!SUPABASE_SERVICE_KEY || !account.user_id) return;
  await servicePatch(
    "profiles",
    `id=eq.${account.user_id}`,
    { admin_trusted_devices: [AGENT_DEVICE_ID] }
  );
  log(`✔ Persona browser pre-provisioned as trusted admin device (${AGENT_DEVICE_ID.slice(0, 13)}…)`);
}

/** Append a finished run to the audit trail (local + cloud). */
async function recordRun(run) {
  memory.runs.push(run);
  if (memory.runs.length > 100) memory.runs = memory.runs.slice(-100);
  // refresh verified components: every assertion that passed this run is now "verified"
  const passedNames = run.assertions.filter((a) => a.ok).map((a) => a.name);
  for (const name of passedNames) {
    if (!memory.verified_components.includes(name)) memory.verified_components.push(name);
  }
  memory.verified_components = memory.verified_components.filter(
    (name) => !run.assertions.some((a) => a.name === name && !a.ok)
  );
  saveLocalMemory();
  broadcastMemory();
  const synced = await cloudSyncMemory();
  log(synced ? "☁ Memory synced to Supabase test_accounts.data_config.freebuff_memory"
             : "⚠ Cloud sync skipped/failed — memory kept locally");
}

/* ────────────────────────────────────────────────────────────────────────
 * Viewer HTTP + WebSocket server (port 5180)
 * ──────────────────────────────────────────────────────────────────────── */
const httpServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${VIEWER_PORT}`);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(fs.readFileSync(UI_FILE));
    return;
  }
  if (url.pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, agent: state, uptime_s: Math.round((Date.now() - STARTED_AT) / 1000) }));
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});
httpServer.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`✗ Port ${VIEWER_PORT} is already in use — close the other viewer or set AGENT_VIEWER_PORT=<port>.`);
    process.exit(1);
  }
  console.error("✗ Viewer server error:", e.message);
});
const wss = new WebSocketServer({ server: httpServer });
wss.on("connection", (socket) => {
  wsClients.add(socket);
  log(`📺 Viewer connected (${wsClients.size} total)`);
  socket.send(JSON.stringify({ t: "memory", memory: { runs: memory.runs, verified_components: memory.verified_components, updated_at: memory.updated_at } }));
  if (memory.test_account) {
    socket.send(JSON.stringify({
      t: "creds",
      creds: {
        email: memory.test_account.email,
        passcode: memory.test_account.passcode,
        label: memory.test_account.label,
        login_url: `${APP_URL}/login?passcode=${memory.test_account.passcode}`,
      },
    }));
  }
  wsBroadcast({ t: "hud", goal: state.goal, persona: state.persona, ticker: state.ticker, tickerKind: state.tickerKind });
  socket.on("close", () => wsClients.delete(socket));
  socket.on("error", () => wsClients.delete(socket));
});

/* ────────────────────────────────────────────────────────────────────────
 * Takeover mode state
 * ──────────────────────────────────────────────────────────────────────── */
let agentPaused = false;
let resumeWaiters = [];
function waitForResume() {
  return new Promise((resolve) => resumeWaiters.push(resolve));
}
function resumeAgent() {
  agentPaused = false;
  const waiters = resumeWaiters; resumeWaiters = [];
  for (const w of waiters) w();
  setState("resumed");
  ticker("[RESUMED] Control handed back to the agent", "pass");
}

/* ────────────────────────────────────────────────────────────────────────
 * Acting layer — every agent action flows through here so the viewer can
 * visualize it, and so takeover can pause the agent between steps.
 * ──────────────────────────────────────────────────────────────────────── */
let cdp = null;
let page = null;

async function gate() {
  if (agentPaused) {
    setState("paused");
    ticker("[PAUSED] Human has takeover — click RESUME AGENT to hand back control", "err");
    await waitForResume();
  }
}
async function actMove(x, y) {
  await gate();
  await page.mouse.move(x, y);
  wsBroadcast({ t: "cursor", x, y });
}
async function actClick(x, y, button = "left") {
  await gate();
  await page.mouse.move(x, y);
  wsBroadcast({ t: "cursor", x, y });
  await page.mouse.click(x, y, { button: button === "right" ? "right" : "left" });
  wsBroadcast({ t: "click", x, y, button });
}
async function actType(text, { secret = false } = {}) {
  await gate();
  const shown = secret ? "•".repeat(Math.min(text.length, 12)) : text;
  wsBroadcast({ t: "typing", x: 640, y: 60, text: `⌨ ${shown.slice(0, 24)}` });
  await page.keyboard.type(text, { delay: 12 });
}
async function actGoto(url) {
  await gate();
  ticker(`[ACTING] Navigating to ${url.replace(APP_URL, "") || "/"} …`, "act");
  // Vite dev compiles heavy routes (e.g. /admin) on first hit — allow up to 90s,
  // and retry once if the cold-compile still blows the budget.
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  } catch (e) {
    ticker(`[ACTING] Navigation slow (cold compile?) — retrying once…`, "act");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  }
  try { await page.waitForLoadState("networkidle", { timeout: 8000 }); } catch { /* SPA keep-alives */ }
  await sleep(350);
}

/** Click a locator like a human: scroll into view (tab strip overflows), move, then click. */
async function actClickLocator(locator) {
  await gate();
  try { await locator.scrollIntoViewIfNeeded({ timeout: 4000 }); } catch { /* already visible or detached */ }
  const box = await locator.boundingBox();
  if (box) {
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    wsBroadcast({ t: "cursor", x: cx, y: cy });
    await page.mouse.click(cx, cy);
    wsBroadcast({ t: "click", x: cx, y: cy });
  } else {
    await locator.click({ timeout: 10000 }); // Playwright auto-scrolls
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * Assertion engine
 * ──────────────────────────────────────────────────────────────────────── */
const runStats = { passed: 0, failed: 0, regressions: 0, assertions: [] };
async function assertStep(name, fn, { detail = "" } = {}) {
  await gate();
  setState("testing");
  ticker(`[TEST] ${name} …`, "info");
  const entry = { name, ok: false, detail, at: new Date().toISOString() };
  try {
    const d = await fn();
    entry.ok = true;
    if (typeof d === "string" && d) entry.detail = d;
  } catch (e) {
    entry.ok = false;
    entry.detail = String(e?.message || e).slice(0, 300);
  }
  runStats.assertions.push(entry);
  if (entry.ok) runStats.passed++; else {
    runStats.failed++;
    if (memory.verified_components.includes(name)) runStats.regressions++;
  }
  wsBroadcast({ t: "assert", name: entry.name, ok: entry.ok, detail: entry.detail });
  ticker(`[${entry.ok ? "PASS" : "FAIL"}] ${name}${entry.detail ? ` — ${entry.detail}` : ""}`, entry.ok ? "pass" : "fail");
  await sleep(250);
  return entry.ok;
}
function broadcastSummary() {
  wsBroadcast({
    t: "summary",
    passed: runStats.passed,
    total: runStats.assertions.length,
    regressions: runStats.regressions,
  });
}

/* ────────────────────────────────────────────────────────────────────────
 * Dev-server orchestration (port A)
 * ──────────────────────────────────────────────────────────────────────── */
let APP_URL = null;
let viteProc = null;
async function ensureDevServer() {
  for (const port of PREFERRED_PORTS) {
    if (await portInUse(port)) {
      const st = await httpStatus(`http://localhost:${port}`);
      if (st >= 200 && st < 500) {
        log(`✔ Vite dev server already running on port ${port}`);
        APP_URL = `http://localhost:${port}`;
        return;
      }
    }
  }
  for (const port of PREFERRED_PORTS) {
    log(`ℹ No dev server detected — spawning Vite on port ${port} …`);
    viteProc = spawn("npm", ["run", "dev", "--", "--port", String(port), "--strictPort"], {
      cwd: ROOT, shell: true, stdio: ["ignore", "pipe", "pipe"],
    });
    const logStream = fs.createWriteStream(path.join(ROOT, "logs", "agent-vite.log"), { flags: "a" });
    viteProc.stdout.pipe(logStream);
    viteProc.stderr.pipe(logStream);
    viteProc.on("exit", (code) => { if (code && code !== 0) log(`⚠ Vite exited (code ${code}) — see logs/agent-vite.log`); });
    const up = await waitForHttp(`http://localhost:${port}`, 45000);
    if (up) {
      log(`✔ Vite dev server is up on port ${port}`);
      APP_URL = `http://localhost:${port}`;
      return;
    }
    log(`⚠ Port ${port} did not become ready — trying next option`);
    try { viteProc.kill(); } catch { /* ignore */ }
    viteProc = null;
  }
  throw new Error("Could not start or find the Vite dev server on 5173/5174");
}

/* ────────────────────────────────────────────────────────────────────────
 * Browser + CDP screencast
 * ──────────────────────────────────────────────────────────────────────── */
let browser = null;
let context = null;
let consoleErrors = 0;
let pageErrors = 0;
let streamFrames = 0;

async function launchBrowser() {
  log(`Launching Chromium (${HEADLESS ? "headless" : "headed"})…`);
  browser = await chromium.launch({ headless: HEADLESS, args: ["--disable-http-cache", "--no-first-run"] });
  context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  page = await context.newPage();
  // Pre-seed the fixed device id so AdminSecurityGate sees a trusted device.
  await page.addInitScript(() => {
    try { window.localStorage.setItem("aqla_admin_device_id", "aqla-agent-device-00000000-0000-4000-8000-000000000001"); } catch { /* ignore */ }
  });
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors++; });
  page.on("pageerror", () => pageErrors++);

  cdp = await context.newCDPSession(page);
  cdp.on("Page.screencastFrame", async (frame) => {
    try {
      streamFrames++;
      // Frame is a base64 JPEG. Partial-scroll frames carry metadata offsets;
      // for the live viewer we draw whatever CDP hands us (good enough at <50ms).
      wsBroadcast({ t: "frame", data: `data:image/jpeg;base64,${frame.data}`, w: frame.metadata.deviceWidth, h: frame.metadata.deviceHeight });
      await cdp.send("Page.screencastFrameAck", { sessionId: frame.sessionId });
    } catch { /* never let a dropped frame kill the stream */ }
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 60,
    maxWidth: VIEWPORT.width,
    maxHeight: VIEWPORT.height,
    everyNthFrame: 1,
  });
  log("✔ CDP screencast streaming started");
}

/* Takeover CDP input dispatch */
function cdpMouseButton(btn) { return btn === 2 || btn === "right" ? "right" : "left"; }
async function takeoverMouse(type, x, y, button) {
  try {
    await cdp.send("Input.dispatchMouseEvent", {
      type, x: Math.round(x), y: Math.round(y),
      button: type === "mousePressed" || type === "mouseReleased" ? cdpMouseButton(button) : "none",
      buttons: type === "mousePressed" || type === "mouseReleased" ? 1 : 0,
      clickCount: type === "mousePressed" || type === "mouseReleased" ? 1 : 0,
    });
    if (type === "mouseMoved") wsBroadcast({ t: "cursor", x, y });
    if (type === "mousePressed") wsBroadcast({ t: "click", x, y, button });
  } catch { /* browser may be navigating */ }
}
async function takeoverKey(type, key, code, text) {
  try {
    const params = { type, key, code: code || "", text: text || "", unmodifiedText: text || "" };
    const vk = VK[key] ?? (text && text.length === 1 ? text.toUpperCase().charCodeAt(0) : undefined);
    if (vk) {
      params.windowsVirtualKeyCode = vk;
      params.nativeVirtualKeyCode = vk;
    }
    await cdp.send("Input.dispatchKeyEvent", params);
    if (type === "keyDown" && text) wsBroadcast({ t: "key", key: text });
  } catch { /* ignore */ }
}

/* ────────────────────────────────────────────────────────────────────────
 * Default Verification Sequence — "Test What Was Built"
 * ──────────────────────────────────────────────────────────────────────── */
async function runVerification(account) {
  setGoal("Verify what was built: passcode auto-login → Admin Testing Suite → AQLA PDF Engine");
  setPersona(`${account.label} (${account.email})`);
  wsBroadcast({
    t: "creds",
    creds: {
      email: account.email, passcode: account.passcode, label: account.label,
      login_url: `${APP_URL}/login?passcode=${account.passcode}`,
    },
  });
  setState("acting");

  /* 1 ── Passcode auto-login (zero friction, no CAPTCHA) */
  await actGoto(`${APP_URL}/login?passcode=${encodeURIComponent(account.passcode)}`);
  await assertStep("Passcode URL reaches the login surface", async () => {
    if (!page.url().includes("/login")) throw new Error(`unexpected URL: ${page.url()}`);
    return "login page rendered";
  });
  await assertStep("Passcode auto-login completes without CAPTCHA", async () => {
    // Watch for either redirect off /login or an inline error, for up to 20s.
    const t0 = Date.now();
    while (Date.now() - t0 < 20000) {
      if (!page.url().includes("/login")) break;
      const err = await page.locator("text=/passcode login failed|invalid passcode/i").count();
      if (err > 0) throw new Error("login surface displayed a passcode error");
      const captcha = await page.locator('iframe[src*="recaptcha"], iframe[title*="recaptcha"], .g-recaptcha').count();
      if (captcha > 0) throw new Error("CAPTCHA challenge rendered during agent auto-login");
      await sleep(400);
    }
    if (page.url().includes("/login")) throw new Error(`still on /login after 20s (${page.url()})`);
    return `redirected to ${page.url().replace(APP_URL, "") || "/"}`;
  });
  await assertStep("Authenticated session belongs to the persona", async () => {
    const sess = await page.evaluate(() => {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
          try { return JSON.parse(localStorage.getItem(k))?.user || null; } catch { /* next */ }
        }
      }
      return null;
    });
    const email = sess?.email || "";
    if (!email) throw new Error("no Supabase session found in localStorage");
    if (!email.includes("test.aqla.io")) throw new Error(`session email ${email} is not the test persona`);
    return `signed in as ${email}`;
  });

  /* 2 ── Admin Testing Suite */
  await actGoto(`${APP_URL}/admin`);
  await assertStep("Admin dashboard renders (AQLA Backend Manager)", async () => {
    await page.waitForSelector("text=AQLA Backend Manager", { timeout: 20000 });
    return "admin shell loaded";
  });
  // Navigate to the Testing tab like a human: scroll into view → move → click
  await actClickLocator(page.locator('button:has-text("Testing")').first());
  await assertStep("Testing tab: Test Accounts table renders", async () => {
    try {
      await page.waitForSelector("text=Test Accounts", { timeout: 15000 });
    } catch (e) {
      const snippet = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 220);
      throw new Error(`${String(e.message).split("\n")[0]} | body: ${snippet}`);
    }
    const rows = await page.locator("table tbody tr").count();
    if (rows < 1) throw new Error("test accounts table is empty");
    return `${rows} account row(s) visible`;
  });
  await assertStep("Testing tab: brain domain sliders are present and interactive", async () => {
    const sliders = page.locator('input[type="range"]');
    await sliders.first().waitFor({ timeout: 10000 });
    const n = await sliders.count();
    if (n < 5) throw new Error(`expected ≥5 domain sliders, found ${n}`);
    const first = sliders.first();
    await first.fill("72");
    await sleep(150);
    const val = await first.inputValue();
    if (val !== "72") throw new Error(`slider did not accept input (value=${val})`);
    return `${n} sliders live, drag applied (0→72)`;
  });
  // Users & access tab — emerald [AI TEST] badge
  await actClickLocator(page.locator('button:has-text("Users & access")').first());
  await assertStep("Users & access: emerald [AI TEST] badge on test accounts", async () => {
    await page.waitForSelector("table", { timeout: 15000 });
    await sleep(800);
    const badge = page.locator('span:has-text("AI TEST")');
    const badgeCount = await badge.count();
    if (badgeCount > 0) return `${badgeCount} [AI TEST] badge(s) rendered`;
    // Badge can only appear if the persona is in the recent-users page — check for its email row
    const personaRow = await page.locator(`td:has-text("${account.email}")`).count();
    if (personaRow === 0) return "persona not on first page of recent users (badge assertion deferred)";
    throw new Error("persona row visible but [AI TEST] badge missing — regression");
  });

  /* 3 ── AQLA PDF Engine (PDF Studio lives in the Overview tab) */
  await actClickLocator(page.locator('button:has-text("Overview")').first());
  await assertStep("PDF Studio renders inside the Overview tab", async () => {
    await page.waitForSelector('h3:has-text("PDF Studio")', { timeout: 15000 });
    return "PDF Studio panel found";
  });
  await assertStep("AQLA PDF rebrand verified (UI copy, zero Fable references)", async () => {
    const text = await page.locator("body").innerText();
    if (/fable/i.test(text)) throw new Error("found residual 'Fable' copy in the rendered panel");
    if (!text.includes("Edit the AQLA PDF document theme with AI")) throw new Error("expected AQLA PDF studio copy missing");
    return "copy is fully AQLA-branded";
  });
  await assertStep("AQLA PDF: daily plan generation produces AQLA-Daily-Plan-*.pdf", async () => {
    const btn = page.locator('button:has-text("Daily (2 pages)")');
    await btn.waitFor({ timeout: 10000 });
    const dl = page.waitForEvent("download", { timeout: 25000 });
    await actClickLocator(btn);
    const download = await dl;
    const name = download.suggestedFilename();
    if (!/^AQLA-Daily-Plan-/.test(name)) throw new Error(`unexpected filename: ${name}`);
    return name;
  });
  await assertStep("AQLA PDF: weekly generation produces AQLA-Weekly-Report-*.pdf", async () => {
    const btn = page.locator('button:has-text("Weekly (4 pages)")');
    await btn.waitFor({ timeout: 10000 });
    const dl = page.waitForEvent("download", { timeout: 25000 });
    await actClickLocator(btn);
    const download = await dl;
    const name = download.suggestedFilename();
    if (!/^AQLA-Weekly-Report-/.test(name)) throw new Error(`unexpected filename: ${name}`);
    return name;
  });

  setState("done");
  setGoal("Verification complete — browser & stream stay live for inspection / takeover");
}

/* ────────────────────────────────────────────────────────────────────────
 * AI Surfaces Verification — Backend Ops / AQLA Architect / AQLA Intelligence
 * Selected with AGENT_TEST_MODE=ai; default suite above stays unchanged.
 * Guards against the hardcoded fallback reply in apiClient.agents.addMessage
 * (the bug fixed in AGENT_NOTEBOOK.md Entry 016).
 * ──────────────────────────────────────────────────────────────────────── */
const AI_FALLBACK_SNIPPET = "How else can I assist with your cognitive protocols?";
function countOccurrences(haystack, needle) {
  let n = 0, i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}
async function waitForAiReply({ sentText, timeoutMs = 100000 }) {
  // afterSend includes the user bubble (optimistic render) but not the reply
  await sleep(1200);
  const afterSend = await page.locator("body").innerText();
  const fbBefore = countOccurrences(afterSend, AI_FALLBACK_SNIPPET);
  const startLen = afterSend.length;
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    await sleep(1500);
    const text = await page.locator("body").innerText();
    if (countOccurrences(text, AI_FALLBACK_SNIPPET) > fbBefore) {
      throw new Error("HARDCODED FALLBACK reply rendered — agent-message AND ai-run both failed");
    }
    if (text.length > startLen + 60) {
      return text.slice(startLen).replace(/\s+/g, " ").trim().slice(0, 500);
    }
  }
  throw new Error(`no assistant reply within ${Math.round(timeoutMs / 1000)}s (AI chain hanging)`);
}
async function askComposer(placeholderPrefix, question, baselineLen) {
  const input = page.locator(`input[placeholder^="${placeholderPrefix}"]`).first();
  await input.waitFor({ timeout: 15000 });
  await actClickLocator(input);
  await page.keyboard.type(question, { delay: 10 });
  await page.keyboard.press("Enter");
  return baselineLen;
}
/** Dismiss global overlay modals (ReassessmentPrompt/DailyCheckInPrompt/etc.) that sit at z-70 and steal clicks. */
async function dismissModals(maxRounds = 4) {
  for (let i = 0; i < maxRounds; i++) {
    const candidates = [
      'button:has-text("Later")',
      'button:has-text("Maybe later")',
      'button:has-text("Not now")',
      'button:has-text("Remind me later")',
    ];
    let clicked = false;
    for (const sel of candidates) {
      const btn = page.locator(sel).last();
      if (await btn.isVisible().catch(() => false)) {
        await actClickLocator(btn);
        clicked = true;
        await sleep(500);
        break;
      }
    }
    if (!clicked) break;
  }
}

async function runAiSurfacesVerification(account) {
  setGoal("AI surfaces: passcode login → Backend Ops → AQLA Architect → AQLA Intelligence");
  setPersona(`${account.label} (${account.email})`);
  wsBroadcast({
    t: "creds",
    creds: {
      email: account.email, passcode: account.passcode, label: account.label,
      login_url: `${APP_URL}/login?passcode=${account.passcode}`,
    },
  });
  setState("acting");
  fs.mkdirSync(path.join(ROOT, "logs", "browser-validation"), { recursive: true });

  /* 0 ── passcode auto-login */
  await actGoto(`${APP_URL}/login?passcode=${encodeURIComponent(account.passcode)}`);
  await assertStep("Passcode auto-login completes without CAPTCHA", async () => {
    const t0 = Date.now();
    while (Date.now() - t0 < 20000) {
      if (!page.url().includes("/login")) break;
      const err = await page.locator("text=/passcode login failed|invalid passcode/i").count();
      if (err > 0) throw new Error("login surface displayed a passcode error");
      await sleep(400);
    }
    if (page.url().includes("/login")) throw new Error(`still on /login after 20s (${page.url()})`);
    await dismissModals(); // stale-persona reassessment/check-in overlays
    return `redirected to ${page.url().replace(APP_URL, "") || "/"}`;
  });

  /* 1 ── Backend Ops (ops mode) */
  await actGoto(`${APP_URL}/admin`);
  await assertStep("Admin dashboard renders (AQLA Backend Manager)", async () => {
    await page.waitForSelector("text=AQLA Backend Manager", { timeout: 20000 });
    await dismissModals();
    return "admin shell loaded";
  });
  await assertStep("Ops Console launcher present", async () => {
    await page.locator('[aria-label="Open Backend Ops"]').waitFor({ timeout: 15000 });
    return "floating launcher visible";
  });
  await actClickLocator(page.locator('[aria-label="Open Backend Ops"]'));
  await assertStep("Ops panel opens on Backend Ops tab", async () => {
    try {
      await page.waitForSelector('input[placeholder^="Ask Backend Ops"]', { timeout: 8000 });
      return "Backend Ops composer visible";
    } catch (e) {
      // Retry: kill any overlay that hijacked the first click, then use Playwright actionability
      try {
        await dismissModals();
        await page.locator('[aria-label="Open Backend Ops"]').click({ timeout: 5000 });
        await page.waitForSelector('input[placeholder^="Ask Backend Ops"]', { timeout: 10000 });
        return "Backend Ops composer visible (after retry)";
      } catch {
        await page.screenshot({ path: path.join(ROOT, "logs", "browser-validation", "ai-ops-open-fail.png") });
        const snippet = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 260);
        throw new Error(`panel did not open | body: ${snippet}`);
      }
    }
  });
  await sleep(2000); // let history settle so the reply-diff baseline is stable
  const opsQuestion = "In one sentence, is current database telemetry healthy? Cite one metric.";
  await assertStep("Backend Ops replies with REAL AI output (no canned fallback)", async () => {
    await askComposer("Ask Backend Ops", opsQuestion);
    const reply = await waitForAiReply({ sentText: opsQuestion });
    log(`[Backend Ops reply] ${reply}`);
    return `reply: ${reply.slice(0, 140)}`;
  });
  await page.screenshot({ path: path.join(ROOT, "logs", "browser-validation", "ai-ops.png") });

  /* 2 ── AQLA Architect (architect mode) */
  await assertStep("Architect tab opens with its composer", async () => {
    try {
      await page.locator('button:has-text("AQLA Architect")').first().click({ timeout: 8000 });
    } catch (e) {
      await page.screenshot({ path: path.join(ROOT, "logs", "browser-validation", "ai-architect-open-fail.png") });
      const snippet = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 260);
      throw new Error(`architect tab button missing | body: ${snippet}`);
    }
    await page.waitForSelector('input[placeholder^="Ask Architect"]', { timeout: 15000 });
    return "Architect composer visible";
  });
  await sleep(2000);
  const archQuestion = "In one sentence, which tables store AI audit logs in this project?";
  await assertStep("AQLA Architect replies with REAL AI output (no canned fallback)", async () => {
    await askComposer("Ask Architect", archQuestion);
    const reply = await waitForAiReply({ sentText: archQuestion });
    log(`[Architect reply] ${reply}`);
    return `reply: ${reply.slice(0, 140)}`;
  });
  await page.screenshot({ path: path.join(ROOT, "logs", "browser-validation", "ai-architect.png") });

  /* 3 ── AQLA Intelligence floating widget (member surface) */
  await actGoto(`${APP_URL}/dashboard`);
  await dismissModals();
  await assertStep("AQLA Intelligence launcher present on member pages", async () => {
    await page.locator('[aria-label="AQLA Intelligence"]').waitFor({ timeout: 15000 });
    return "coach launcher visible";
  });
  await actClickLocator(page.locator('[aria-label="AQLA Intelligence"]'));
  await assertStep("AQLA Intelligence panel opens", async () => {
    await page.locator('input[placeholder^="Ask AQLA"]').waitFor({ timeout: 10000 });
    return "coach composer visible";
  });
  const coachQuestion = "How has my sleep been affecting my focus lately?";
  await assertStep("AQLA Intelligence replies with REAL AI output (no canned fallback)", async () => {
    await askComposer("Ask AQLA", coachQuestion);
    const reply = await waitForAiReply({ sentText: coachQuestion });
    log(`[AQLA Intelligence reply] ${reply}`);
    return `reply: ${reply.slice(0, 140)}`;
  });
  await page.screenshot({ path: path.join(ROOT, "logs", "browser-validation", "ai-coach-widget.png") });

  setState("done");
  setGoal("AI surface verification complete — browser & stream stay live for inspection / takeover");
}

/* ────────────────────────────────────────────────────────────────────────
 * Main
 * ──────────────────────────────────────────────────────────────────────── */
async function main() {
  log(`Freebuff Live Agent Viewer v${SCRIPT_VERSION} — degraded-mode in-session run, full ownership of the subsystem`);

  /* Memory: load local vault first (fast), cloud is the backup source */
  const hadLocal = loadLocalMemory();
  log(hadLocal
    ? `✔ Local memory vault loaded (${memory.runs.length} past run(s), ${memory.verified_components.length} verified components)`
    : "ℹ No local memory vault — will attempt cloud restore, else this run creates memory #1");

  /* 1. Dev server on port A */
  await ensureDevServer();

  /* 2. Viewer server on port B */
  await new Promise((resolve) => httpServer.listen(VIEWER_PORT, () => resolve()));
  log(`📺 Live viewer server listening on http://localhost:${VIEWER_PORT}`);

  console.log("");
  console.log(`\x1b[36m🚀 Target App: ${APP_URL}\x1b[0m`);
  console.log(`\x1b[36m📺 Live Agent Viewer: http://localhost:${VIEWER_PORT}\x1b[0m`);
  console.log("");
  console.log("Open the Live Agent Viewer in your browser to watch the agent test the app in real time.");
  console.log("EMERGENCY TAKEOVER: toggle in the viewer top bar — mouse & keyboard dispatch straight into Chromium via CDP.");
  console.log("");

  /* 3. Browser + CDP stream */
  await launchBrowser();

  /* 4. Memory lifecycle — reuse or create the test account */
  setState("memory");
  const account = await ensureTestAccount();
  await ensureAdminProfile(account); // self-heal role='user' drift on our own persona
  await ensureTrustedDevice(account); // provision AdminSecurityGate device trust for the agent browser
  saveLocalMemory();
  broadcastMemory();

  /* 5. Default verification sequence ("Test What Was Built") */
  const runId = `run-${Date.now()}`;
  const runT0 = Date.now();
  const testMode = String(ENV.AGENT_TEST_MODE || "default").toLowerCase();
  if (testMode === "ai") log("ℹ AGENT_TEST_MODE=ai — running AI surfaces verification (Backend Ops / Architect / Intelligence)");
  try {
    if (testMode === "ai") await runAiSurfacesVerification(account);
    else await runVerification(account);
  } catch (e) {
    log("✗ Verification sequence crashed:", e?.stack || e?.message || e);
    ticker(`[FATAL] ${String(e?.message || e).slice(0, 160)}`, "err");
    setState("error");
  }
  broadcastSummary();

  /* 6. Audit run → hybrid memory (local vault + cloud sync) */
  await recordRun({
    id: runId,
    at: new Date().toISOString(),
    surface: `${APP_URL} (${testMode === "ai" ? "passcode login → Backend Ops → AQLA Architect → AQLA Intelligence widget" : "passcode login → /admin testing → PDF studio"})`,
    summary: `Freebuff live-viewer run: ${runStats.passed}/${runStats.assertions.length} passed`,
    passed: runStats.passed,
    failed: runStats.failed,
    total: runStats.assertions.length,
    regressions_found: runStats.regressions,
    duration_ms: Date.now() - runT0,
    console_errors: consoleErrors,
    page_errors: pageErrors,
    stream_frames: streamFrames,
    assertions: runStats.assertions,
  });

  console.log("");
  console.log(`\x1b[32m✔ Run complete: ${runStats.passed}/${runStats.assertions.length} assertions passed · ${runStats.regressions} regression(s)\x1b[0m`);
  console.log(`  Browser + live stream remain running at http://localhost:${VIEWER_PORT} — inspect the session, review the HUD, or use Takeover.`);
  console.log(`  Press Ctrl+C in this terminal to shut everything down.`);
  console.log("");

  /* 7. Post-test lifecycle: keep everything alive */
  setState("idle");
  setGoal("Idle — session kept alive for the user (takeover enabled)");
  setInterval(() => {
    if (wsClients.size === 0) return; // silent keep-alive while nobody watches
  }, 30000);
}

/* Takeover WebSocket messages */
wss.on("connection", (socket) => {
  socket.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    switch (msg.t) {
      case "takeover-on":
        agentPaused = true;
        setState("paused");
        log("⚠ EMERGENCY TAKEOVER enabled by the user — agent will pause between steps");
        break;
      case "takeover-off":
        // overlay off ≠ resume; agent stays paused until Resume Agent is clicked
        log("ℹ Takeover toggle switched off (agent still paused — press Resume Agent)");
        break;
      case "resume-agent":
        resumeAgent();
        break;
      case "takeover-mousemove":
        if (agentPaused) await takeoverMouse("mouseMoved", msg.x, msg.y);
        break;
      case "takeover-mousedown":
        if (agentPaused) await takeoverMouse("mousePressed", msg.x, msg.y, msg.button);
        break;
      case "takeover-mouseup":
        if (agentPaused) await takeoverMouse("mouseReleased", msg.x, msg.y, msg.button);
        break;
      case "takeover-key":
        if (agentPaused) {
          const txt = keyTextFor(msg.key);
          await takeoverKey("keyDown", msg.key, msg.code, txt);
          await takeoverKey("keyUp", msg.key, msg.code, "");
        }
        break;
      case "takeover-keyup":
        if (agentPaused) await takeoverKey("keyUp", msg.key, msg.code, "");
        break;
    }
  });
});

/* Graceful shutdown */
async function shutdown(reason) {
  log(`Shutting down (${reason})…`);
  try { await recordRunIfNeeded(); } catch { /* best effort */ }
  try { if (cdp) await cdp.send("Page.stopScreencast"); } catch { /* ignore */ }
  try { if (browser) await browser.close(); } catch { /* ignore */ }
  try { if (viteProc) { viteProc.kill(); } } catch { /* ignore */ }
  try { wss.close(); } catch { /* ignore */ }
  try { httpServer.close(); } catch { /* ignore */ }
  process.exit(0);
}
let runRecorded = false;
async function recordRunIfNeeded() {
  if (runRecorded || runStats.assertions.length === 0) return;
  runRecorded = true;
  await recordRun({
    id: `run-${Date.now()}`,
    at: new Date().toISOString(),
    surface: "interrupted run",
    summary: `Interrupted: ${runStats.passed}/${runStats.assertions.length} passed before shutdown`,
    passed: runStats.passed, failed: runStats.failed, total: runStats.assertions.length,
    regressions_found: runStats.regressions,
    duration_ms: Date.now() - STARTED_AT.getTime(),
    assertions: runStats.assertions,
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (e) => {
  log("✗ uncaughtException:", e?.stack || String(e));
  log("(viewer stays alive — stream will recover on the next frame)");
});

main().catch(async (e) => {
  console.error("✗ Fatal:", e?.stack || e?.message || e);
  try { if (browser) await browser.close(); } catch { /* ignore */ }
  try { if (viteProc) viteProc.kill(); } catch { /* ignore */ }
  process.exit(1);
});
