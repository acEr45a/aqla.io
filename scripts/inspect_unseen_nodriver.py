import asyncio
import os
import sys
import nodriver as uc

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

OUT_DIR = os.path.abspath("logs/browser-validation/unseen-nodriver")
os.makedirs(OUT_DIR, exist_ok=True)

async def inspect_unseen_nodriver():
    print("🚀 Launching nodriver (undetected CDP) to inspect unseen.co...")
    # Launch browser without webdriver flag, completely undetected
    browser = await uc.start(headless=True)
    
    try:
        print("Navigating to https://unseen.co ...")
        page = await browser.get("https://unseen.co")
        
        # Wait for initial WebGL and loader
        print("Waiting 5s for WebGL canvas and intro animations...")
        await page.sleep(5)
        
        title = await page.evaluate("document.title")
        print(f"Page Title: {title}")
        
        hero_path = os.path.join(OUT_DIR, "01_unseen_hero.png")
        await page.save_screenshot(hero_path)
        print(f"✓ Saved hero screenshot: {hero_path}")
        
        # Extract canvas and DOM telemetry
        raw_dom_details = await page.evaluate("""
            JSON.stringify((() => {
                const canvases = document.querySelectorAll('canvas');
                const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim()).filter(Boolean);
                const buttons = Array.from(document.querySelectorAll('button, a[role="button"]')).map(b => b.innerText.trim()).filter(Boolean);
                return {
                    canvasCount: canvases.length,
                    headings: headings.slice(0, 10),
                    buttons: buttons.slice(0, 10),
                    bgColor: window.getComputedStyle(document.body).backgroundColor
                };
            })())
        """)
        import json
        dom_details = json.loads(raw_dom_details) if isinstance(raw_dom_details, str) else {}
        print(f"DOM & Canvas Details: {dom_details}")
        
        # Look for Enter or click to enter
        print("Searching for interactive enter button or overlay...")
        enter_clicked = await page.evaluate("""
            (() => {
                const enter = Array.from(document.querySelectorAll('button, a, div[role="button"]')).find(el => 
                    /enter/i.test(el.innerText || el.getAttribute('aria-label') || '')
                );
                if (enter) {
                    enter.click();
                    return true;
                }
                return false;
            })()
        """)
        print(f"Enter button clicked: {enter_clicked}")
        
        await page.sleep(4)
        
        inside_path = os.path.join(OUT_DIR, "02_unseen_inside.png")
        await page.save_screenshot(inside_path)
        print(f"✓ Saved inside screenshot: {inside_path}")
        
        # Scroll down into the 3D space
        print("Scrolling down into 3D experience...")
        await page.evaluate("window.scrollBy(0, 1200);")
        await page.sleep(3)
        
        scroll_path = os.path.join(OUT_DIR, "03_unseen_scrolled.png")
        await page.save_screenshot(scroll_path)
        print(f"✓ Saved scrolled screenshot: {scroll_path}")
        
        print("\n✅ Unseen Studio inspection with nodriver finished successfully!")
        
    except Exception as e:
        print(f"❌ Error during nodriver inspection: {e}")
    finally:
        browser.stop()

if __name__ == "__main__":
    uc.loop().run_until_complete(inspect_unseen_nodriver())
