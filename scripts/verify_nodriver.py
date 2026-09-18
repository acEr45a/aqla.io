import asyncio
import nodriver as uc
import os

async def test_run():
    print("Starting nodriver browser (headless)...")
    browser = await uc.start(headless=True)
    print("Navigating to localhost:5173...")
    page = await browser.get("http://localhost:5173/mockup-4")
    await page.sleep(3)
    res = await page.evaluate("(() => ({ canvasCount: document.querySelectorAll('canvas').length }))()")
    print(f"Evaluated type: {type(res)}, value: {res}")
    
    os.makedirs("logs/browser-validation/nodriver", exist_ok=True)
    screenshot_path = "logs/browser-validation/nodriver/test_mockup4.png"
    await page.save_screenshot(screenshot_path)
    print(f"Saved screenshot to: {screenshot_path}")
    
    browser.stop()
    print("nodriver test complete!")

if __name__ == "__main__":
    uc.loop().run_until_complete(test_run())
