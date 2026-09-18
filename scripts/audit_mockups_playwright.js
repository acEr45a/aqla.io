import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('logs/browser-validation/mockup-qa');
mkdirSync(outDir, { recursive: true });

const MOCKUP_ROUTES = [
  { name: 'Mockup-1-Tunnel', path: '/mockup-1', expectedText: 'Your brain is broadcasting telemetry' },
  { name: 'Mockup-2-Matrix', path: '/mockup-2', expectedText: 'Holographic' },
  { name: 'Mockup-3-Luxury', path: '/mockup-3', expectedText: 'Circadian' },
  { name: 'Mockup-4-Unseen', path: '/mockup-4', expectedText: 'frosted clarity' }
];

async function runPlaywrightQAAudit() {
  console.log('🚀 Launching Playwright Chromium for AQLA Mockups Full Audit...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleLogs.push({ type: 'error', text: msg.text() });
  });
  page.on('pageerror', err => pageErrors.push(String(err)));

  const auditResults = [];

  for (const m of MOCKUP_ROUTES) {
    const url = `http://localhost:5173${m.path}`;
    console.log(`\n========================================\nTesting ${m.name} at ${url}...`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000); // allow Three.js WebGL and Anime.js timeline to mount

      // 1. Initial Hero Capture
      const heroPic = path.join(outDir, `${m.name}-01-hero.png`);
      await page.screenshot({ path: heroPic });
      console.log(`✓ Hero screenshot captured: ${heroPic}`);

      // 2. Inspect Canvas & DOM
      const domDetails = await page.evaluate((expected) => {
        const canvases = document.querySelectorAll('canvas');
        const textFound = document.body.innerText.includes(expected);
        const curtain = document.querySelector('[style*="transform-origin"]') || document.querySelector('.bg-\\[\\#06080c\\]');
        return {
          canvasesCount: canvases.length,
          canvasVisible: canvases.length > 0 && canvases[0].clientWidth > 100,
          expectedFound: textFound,
          curtainAttached: !!curtain,
        };
      }, m.expectedText);

      // 3. Scroll Down (50% page) to verify scroll reactivity
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(2000);
      const scrollPic = path.join(outDir, `${m.name}-02-scrolled.png`);
      await page.screenshot({ path: scrollPic });
      console.log(`✓ Scrolled screenshot captured: ${scrollPic}`);

      auditResults.push({
        name: m.name,
        path: m.path,
        ok: true,
        canvases: domDetails.canvasesCount,
        canvasActive: domDetails.canvasVisible,
        expectedCopyMatched: domDetails.expectedFound,
        curtainMounted: domDetails.curtainAttached
      });

    } catch (err) {
      console.error(`✗ Error on ${m.name}:`, err.message);
      auditResults.push({
        name: m.name,
        path: m.path,
        ok: false,
        error: err.message
      });
    }
  }

  // 4. Test Transition Curtain: Click Mockup 4 from Mockup 1
  console.log('\n--- Testing Page Transition Curtain (Navigating from /mockup-1 to /mockup-4 via Click) ---');
  try {
    await page.goto('http://localhost:5173/mockup-1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const mockup4Btn = page.locator('a[href="/mockup-4"]').first();
    if (await mockup4Btn.count() > 0) {
      // Click link
      await mockup4Btn.click();
      // Fast capture right during transition
      await page.waitForTimeout(100);
      const transitionPic = path.join(outDir, '00-transition-curtain-active.png');
      await page.screenshot({ path: transitionPic });
      console.log(`✓ Mid-transition frame captured: ${transitionPic}`);

      await page.waitForTimeout(1500);
      const transitionArrivedPic = path.join(outDir, '00-transition-arrived-mockup4.png');
      await page.screenshot({ path: transitionArrivedPic });
      console.log(`✓ Post-transition frame captured: ${transitionArrivedPic}`);
    }
  } catch (err) {
    console.warn('Transition click check warning:', err.message);
  }

  await browser.close();

  console.log('\n================ AUDIT SUMMARY ================');
  console.log(JSON.stringify(auditResults, null, 2));
  console.log('Console Errors:', consoleLogs.length);
  console.log('Page Runtime Errors:', pageErrors.length);

  return { auditResults, consoleLogs, pageErrors };
}

runPlaywrightQAAudit();
