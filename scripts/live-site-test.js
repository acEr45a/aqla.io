// Freebuff live-site validation — https://www.aqla.io (Section 4 Browser Validation Protocol)
// Read-only anonymous pass: renders pages, tests nav + auth-guard redirects, captures
// screenshots, console errors, and failed network requests. No writes to production data.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.aqla.io';
const outDir = path.resolve('logs/browser-validation/live-2026-09-11');
mkdirSync(outDir, { recursive: true });

const results = [];

function makeCollector() {
  return { consoleErrors: [], pageErrors: [], failedRequests: [] };
}

async function newPage(browser, collector, viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  page.on('console', (m) => { if (m.type() === 'error') collector.consoleErrors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => collector.pageErrors.push(String(e).slice(0, 300)));
  page.on('response', (r) => {
    if (r.status() >= 400) collector.failedRequests.push(`${r.status()} ${r.url().slice(0, 160)}`);
  });
  return page;
}

async function testRoute(browser, route, { expects = [], viewport, interactions } = {}) {
  const name = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '') || 'home';
  const collector = makeCollector();
  const entry = { route, name, ok: false, checks: [] };
  let page;
  try {
    page = await newPage(browser, collector, viewport);
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // SPA settle

    for (const [label, fn] of expects) {
      try {
        await fn(page);
        entry.checks.push({ label, pass: true });
      } catch (e) {
        entry.checks.push({ label, pass: false, detail: String(e).split('\n')[0].slice(0, 200) });
      }
    }

    if (interactions) await interactions(page, entry);

    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
    entry.finalUrl = page.url().replace(BASE, '') || '/';
    entry.ok = entry.checks.every((c) => c.pass);
  } catch (e) {
    entry.error = String(e).split('\n')[0].slice(0, 300);
  } finally {
    if (page) await page.close().catch(() => {});
  }
  entry.consoleErrors = collector.consoleErrors;
  entry.pageErrors = collector.pageErrors;
  entry.failedRequests = collector.failedRequests;
  results.push(entry);
  const status = entry.ok ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${route} -> ${entry.finalUrl || entry.error || ''}`);
  return entry;
}

const browser = await chromium.launch({ headless: true });

// 1. Landing
await testRoute(browser, '/', {
  expects: [
    ['title contains AQLA', async (p) => { if (!(await p.title()).includes('AQLA')) throw new Error(await p.title()); }],
    ['hero text visible', (p) => p.getByText(/brain/i).first().waitFor({ timeout: 5000 })],
  ],
  interactions: async (p, entry) => {
    // click-through: landing nav -> Sign in
    try {
      await p.getByRole('link', { name: /sign in/i }).first().click({ timeout: 5000 });
      await p.waitForURL('**/login', { timeout: 8000 });
      entry.checks.push({ label: 'nav click: Sign in -> /login', pass: true });
    } catch (e) {
      entry.checks.push({ label: 'nav click: Sign in -> /login', pass: false, detail: String(e).split('\n')[0].slice(0, 200) });
    }
  },
});

// 2. Auth pages render (forms only — no submission with credentials)
await testRoute(browser, '/login', {
  expects: [['email input present', (p) => p.locator('input[type=email], input[name=email], #email').first().waitFor({ timeout: 5000 })]],
});
await testRoute(browser, '/register', {
  expects: [['email input present', (p) => p.locator('input[type=email], input[name=email], #email').first().waitFor({ timeout: 5000 })]],
});
await testRoute(browser, '/start', { expects: [] });

// 3. Legal/static pages
await testRoute(browser, '/privacy', {
  expects: [['substantial text content', async (p) => { const t = await p.locator('body').innerText(); if (t.trim().length < 300) throw new Error(`only ${t.length} chars`); }]],
});
await testRoute(browser, '/terms', {
  expects: [['substantial text content', async (p) => { const t = await p.locator('body').innerText(); if (t.trim().length < 300) throw new Error(`only ${t.length} chars`); }]],
});

// 4. Auth-guard behavior on protected routes (anonymous -> /login)
await testRoute(browser, '/dashboard', {
  expects: [['redirected to /login', async (p) => { await p.waitForURL('**/login', { timeout: 8000 }); }]],
});
await testRoute(browser, '/admin', {
  expects: [['redirected to /login (admin gate)', async (p) => { await p.waitForURL('**/login', { timeout: 8000 }); }]],
});

// 5. 404 catch-all
await testRoute(browser, '/definitely-not-a-real-page', {
  expects: [['404 page shown', (p) => p.getByText(/not found|404/i).first().waitFor({ timeout: 5000 })]],
});

// 6. Mobile viewport spot-check (landing + login)
const mobile = { width: 375, height: 812 };
await testRoute(browser, '/', { viewport: mobile, expects: [['hero visible on mobile', (p) => p.getByText(/brain/i).first().waitFor({ timeout: 5000 })]] });
await testRoute(browser, '/login', {
  viewport: mobile,
  expects: [['email input present on mobile', (p) => p.locator('input[type=email], input[name=email], #email').first().waitFor({ timeout: 5000 })]],
});

await browser.close();

const passCount = results.filter((r) => r.ok).length;
const summary = {
  timestamp: new Date().toISOString(),
  base: BASE,
  tool: 'Playwright headless Chromium (chromium-1243)',
  totals: { tested: results.length, passed: passCount, failed: results.length - passCount },
  results,
};
writeFileSync(path.join(outDir, 'live-test-result.json'), JSON.stringify(summary, null, 2));
console.log(`\n=== ${passCount}/${results.length} routes passed. Report: ${outDir}/live-test-result.json ===`);
process.exit(passCount === results.length ? 0 : 1);
