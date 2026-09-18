import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('logs/browser-validation/unseen');
mkdirSync(outDir, { recursive: true });

async function enterAndInspectUnseen() {
  console.log('Launching Playwright for Unseen Studio click enter...');
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
    await page.goto('https://unseen.co', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Look for the "Enter" or "ENTER WITHOUT AUDIO" button
    console.log('Clicking Enter button...');
    const enterBtn = page.locator('button:has-text("Enter"), a:has-text("Enter"), [role="button"]:has-text("Enter")').first();
    if (await enterBtn.count() > 0) {
      await enterBtn.click();
    } else {
      // fallback click on center of screen
      await page.mouse.click(720, 575);
    }

    console.log('Waiting 5s for 3D world to reveal...');
    await page.waitForTimeout(5000);

    const worldPath1 = path.join(outDir, '04_unseen_inside_hero.png');
    await page.screenshot({ path: worldPath1 });
    console.log('Captured:', worldPath1);

    // Scroll inside the experience
    console.log('Scrolling inside the 3D world...');
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(3000);

    const worldPath2 = path.join(outDir, '05_unseen_inside_scroll.png');
    await page.screenshot({ path: worldPath2 });
    console.log('Captured:', worldPath2);

    await browser.close();
    console.log('Complete.');
  } catch (err) {
    console.error('Error:', err.message);
    await browser.close();
  }
}

enterAndInspectUnseen();
