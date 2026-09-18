import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('logs/browser-validation/unseen');
mkdirSync(outDir, { recursive: true });

async function inspectUnseen() {
  console.log('Launching Playwright Chromium for unseen.co...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to https://unseen.co ...');
    await page.goto('https://unseen.co', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000); // Allow WebGL canvas and intro animations to load

    const title = await page.title();
    console.log('Page Title:', title);

    // Take initial hero screenshot
    const heroPath = path.join(outDir, '01_unseen_hero.png');
    await page.screenshot({ path: heroPath });
    console.log('Captured:', heroPath);

    // Inspect WebGL canvas and main structure
    const canvasDetails = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      const headings = [...document.querySelectorAll('h1, h2, h3')].map(h => h.innerText.trim()).filter(Boolean);
      const navLinks = [...document.querySelectorAll('nav a, header a')].map(a => a.innerText.trim()).filter(Boolean);
      return {
        canvasCount: canvases.length,
        headings: headings.slice(0, 8),
        navLinks: navLinks.slice(0, 8),
        bodyBg: window.getComputedStyle(document.body).backgroundColor
      };
    });
    console.log('DOM & Canvas Inspection:', JSON.stringify(canvasDetails, null, 2));

    // Scroll down 800px and capture
    console.log('Scrolling down 800px...');
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(2500);
    const scroll1Path = path.join(outDir, '02_unseen_scroll1.png');
    await page.screenshot({ path: scroll1Path });
    console.log('Captured:', scroll1Path);

    // Scroll down another 1200px and capture
    console.log('Scrolling down another 1200px...');
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(2500);
    const scroll2Path = path.join(outDir, '03_unseen_scroll2.png');
    await page.screenshot({ path: scroll2Path });
    console.log('Captured:', scroll2Path);

    await browser.close();
    console.log('Inspection complete.');
  } catch (err) {
    console.error('Error visiting unseen.co:', err.message);
    await browser.close();
  }
}

inspectUnseen();
