// Freebuff browser smoke test — Playwright headless Chromium
// Usage: node scripts/browser-smoke-test.js [url]
// Artifacts: logs/browser-validation/ (git-ignored)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PRIMARY_URL = process.argv[2] || 'http://localhost:5173';
const FALLBACK_URL = 'https://example.com';
const outDir = path.resolve('logs/browser-validation');
mkdirSync(outDir, { recursive: true });

const consoleErrors = [];
const pageErrors = [];

async function check(url, screenshotName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500); // settle SPA render
    const title = await page.title();
    await page.screenshot({ path: path.join(outDir, screenshotName), fullPage: true });
    const bodyText = (await page.locator('body').innerText()).slice(0, 200);
    await browser.close();
    return { url, ok: true, title, bodyPreview: bodyText.replace(/\s+/g, ' ') };
  } catch (err) {
    await browser.close();
    return { url, ok: false, error: String(err).slice(0, 300) };
  }
}

const result = await check(PRIMARY_URL, 'smoke-home.png');
let finalResult = result;
if (!result.ok && PRIMARY_URL.startsWith('http://localhost')) {
  console.log(`Local check failed (${result.error}); falling back to ${FALLBACK_URL}`);
  finalResult = await check(FALLBACK_URL, 'smoke-fallback.png');
}

const report = {
  timestamp: new Date().toISOString(),
  tool: 'Playwright headless Chromium (chromium-1243)',
  primary: PRIMARY_URL,
  result: finalResult,
  consoleErrors,
  pageErrors,
};
writeFileSync(path.join(outDir, 'smoke-result.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(finalResult.ok ? 0 : 1);
