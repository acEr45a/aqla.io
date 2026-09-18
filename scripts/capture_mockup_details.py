import asyncio
import os
import sys
import nodriver as uc

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUT_DIR = os.path.abspath("logs/browser-validation/mockup-details")
os.makedirs(OUT_DIR, exist_ok=True)

async def capture_details():
    browser = await uc.start(headless=True)
    try:
        # Mockup 1: Scroll to PVT-B Reaction Task
        print("Capturing Mockup 1 PVT-B Lab...")
        p1 = await browser.get("http://localhost:5173/mockup-1")
        await p1.sleep(3)
        await p1.evaluate("window.scrollTo(0, 1800);")
        await p1.sleep(2)
        await p1.save_screenshot(os.path.join(OUT_DIR, "m1_pvtb_lab.png"))

        # Mockup 2: Scroll to Radar & Digit Span Memory test
        print("Capturing Mockup 2 Radar & Memory...")
        p2 = await browser.get("http://localhost:5173/mockup-2")
        await p2.sleep(3)
        await p2.evaluate("window.scrollTo(0, 750);")
        await p2.sleep(2)
        await p2.save_screenshot(os.path.join(OUT_DIR, "m2_radar_memory.png"))

        # Mockup 3: Scroll to Circadian Clock Dial
        print("Capturing Mockup 3 Circadian Dial...")
        p3 = await browser.get("http://localhost:5173/mockup-3")
        await p3.sleep(3)
        await p3.evaluate("window.scrollTo(0, 600);")
        await p3.sleep(2)
        await p3.save_screenshot(os.path.join(OUT_DIR, "m3_circadian_dial.png"))

        # Master Narrative: Scroll to Bento Grid
        print("Capturing Master Narrative Bento Grid...")
        p4 = await browser.get("http://localhost:5173/landing-v2")
        await p4.sleep(3)
        await p4.evaluate("window.scrollTo(0, 3200);")
        await p4.sleep(2)
        await p4.save_screenshot(os.path.join(OUT_DIR, "m5_bento_grid.png"))

        print("Done capturing details!")
    finally:
        browser.stop()

if __name__ == "__main__":
    uc.loop().run_until_complete(capture_details())
