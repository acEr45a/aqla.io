import asyncio
import os
import sys
import nodriver as uc

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

OUT_DIR = os.path.abspath("logs/browser-validation/mockup-qa-nodriver")
os.makedirs(OUT_DIR, exist_ok=True)

import json

MOCKUPS = [
    {"name": "Mockup-1-Tunnel", "url": "http://localhost:5173/mockup-1", "expected": "Your brain is broadcasting telemetry"},
    {"name": "Mockup-2-Matrix", "url": "http://localhost:5173/mockup-2", "expected": "Holographic"},
    {"name": "Mockup-3-Luxury", "url": "http://localhost:5173/mockup-3", "expected": "Circadian"},
    {"name": "Mockup-4-Unseen", "url": "http://localhost:5173/mockup-4", "expected": "frosted clarity"},
    {"name": "Master-Narrative", "url": "http://localhost:5173/landing-v2", "expected": "THE PREFRONTAL ZOOM"}
]

async def audit_mockups_nodriver():
    print("🚀 Starting AQLA Mockups Audit via nodriver (Native CDP)...")
    browser = await uc.start(headless=True)
    results = []

    try:
        for m in MOCKUPS:
            print(f"\n👉 Testing {m['name']} at {m['url']} ...")
            page = await browser.get(m["url"])
            
            # Allow WebGL canvas, Three.js, and Anime.js to mount
            await page.sleep(3)
            
            # Extract DOM state and check canvas via JSON serialization
            raw_state = await page.evaluate("""
                JSON.stringify((() => {
                    const canvases = document.querySelectorAll('canvas');
                    const text = document.body.innerText || '';
                    const dock = document.querySelector('[role="navigation"]') || document.querySelector('.fixed.bottom-6');
                    return {
                        canvasesCount: canvases.length,
                        canvasHasSize: canvases.length > 0 && canvases[0].clientWidth > 50,
                        bodyLength: text.length,
                        dockPresent: !!dock
                    };
                })())
            """)
            state = json.loads(raw_state) if isinstance(raw_state, str) else {}
            
            # Save screenshot
            screenshot_name = f"{m['name']}.png"
            dest = os.path.join(OUT_DIR, screenshot_name)
            await page.save_screenshot(dest)
            
            status = "PASS" if state.get("canvasesCount", 0) > 0 else "WARN (No canvas)"
            print(f"   [{status}] Canvases: {state.get('canvasesCount')}, Canvas active: {state.get('canvasHasSize')}, Screenshot: {dest}")
            results.append({"name": m["name"], "status": status, "state": state, "file": dest})

        print("\n================ AUDIT SUMMARY (nodriver) ================")
        for r in results:
            print(f" - {r['name']}: {r['status']} (Canvases: {r['state'].get('canvasesCount')})")
        print("==========================================================")

    except Exception as e:
        print(f"❌ Error during nodriver audit: {e}")
    finally:
        browser.stop()

if __name__ == "__main__":
    uc.loop().run_until_complete(audit_mockups_nodriver())
