#!/usr/bin/env python3
"""
Dynamic Dual Browser Runner (Playwright & nodriver)
---------------------------------------------------
Allows dynamic switching between:
- nodriver: Undetected Chrome DevTools Protocol (CDP) for anti-bot, Cloudflare, WebGL & external sites.
- playwright: Fast headless Chromium automation via Node.js Playwright.

Usage:
  python scripts/browser_runner.py --target=unseen --driver=nodriver
  python scripts/browser_runner.py --target=unseen --driver=playwright
  python scripts/browser_runner.py --target=mockups --driver=nodriver
  python scripts/browser_runner.py --target=mockups --driver=playwright
  python scripts/browser_runner.py --target=auto (automatically picks nodriver for external, playwright/nodriver for local)
"""

import sys
import subprocess
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def run_command(cmd):
    print(f"⚡ Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    return result.returncode

def main():
    parser = argparse.ArgumentParser(description="Dynamic Dual Browser Runner (nodriver & Playwright)")
    parser.add_argument("--target", choices=["unseen", "mockups"], default="mockups", help="Target task to run")
    parser.add_argument("--driver", choices=["nodriver", "playwright", "auto"], default="auto", help="Browser driver engine")
    args = parser.parse_args()

    driver = args.driver
    if driver == "auto":
        if args.target == "unseen":
            driver = "nodriver"  # nodriver excels at bypassing bot protection on external design sites
        else:
            driver = "nodriver"  # nodriver runs natively on local WebGL mockups

    print(f"🎯 Target: {args.target.upper()} | 🛠️ Selected Driver: {driver.upper()}")

    if args.target == "unseen":
        if driver == "nodriver":
            code = run_command([sys.executable, "scripts/inspect_unseen_nodriver.py"])
        else:
            code = run_command(["node", "scripts/inspect_unseen.js"])
    elif args.target == "mockups":
        if driver == "nodriver":
            code = run_command([sys.executable, "scripts/audit_mockups_nodriver.py"])
        else:
            code = run_command(["node", "scripts/audit_mockups_playwright.js"])
    else:
        print("Unknown target")
        code = 1

    sys.exit(code)

if __name__ == "__main__":
    main()
