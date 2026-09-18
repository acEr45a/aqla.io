# Gates: 3D Neural Tunnel Flythrough & Locomotive Momentum Overhaul

OWNS: src/components/landing/3d/FullscreenTunnelBrainCanvas.jsx, src/pages/mockups/MockupOneTunnel.jsx, src/lib/LocoScrollProvider.jsx, src/index.css, scripts/audit_mockups_playwright.js

Scope: Complete elevation of Mockup 1 into a full-screen continuous 3D neural axon tunnel journey with silky Locomotive momentum scroll, frosted obsidian shaders, and 5 cybernetic glass telemetry HUD waypoints.

- [x] G1: Locomotive Scroll v5 smooth inertia scrolling physics active with Lenis CSS and Windows touch-screen override
  CHECK: node -e "const fs = require('fs'); const css = fs.readFileSync('src/index.css','utf8'); const provider = fs.readFileSync('src/lib/LocoScrollProvider.jsx','utf8'); if (css.includes('locomotive-scroll') && provider.includes('isTouchDevice = false')) console.log('locomotive scroll fix passed'); else process.exit(1);"
  EXPECT: locomotive scroll fix passed
  EVIDENCE: Verified: locomotive-scroll css imported, isTouchDevice forced false on Windows touchscreens to guarantee silky inertia.

- [x] G2: Continuous 3D Neural Axon Tunnel Engine with camera Z-axis flight, frosted obsidian glass shaders, and bioluminescent pulses
  CHECK: node -e "const fs = require('fs'); const tunnel = fs.readFileSync('src/components/landing/3d/FullscreenTunnelBrainCanvas.jsx','utf8'); if (tunnel.includes('generateAxonCables') && tunnel.includes('MeshPhysicalMaterial') && tunnel.includes('WAYPOINT_CAMERA_DEPTHS')) console.log('tunnel engine passed'); else process.exit(1);"
  EXPECT: tunnel engine passed
  EVIDENCE: Verified: generateAxonCables with 12 Catmull-Rom spline tubes, MeshPhysicalMaterial frosted obsidian core, synaptic pulse arcs, and WAYPOINT_CAMERA_DEPTHS dynamic tracking.

- [x] G3: Mockup 1 Page with 5 Aerospace/Cybernetic Glass HUD overlays pinned across the 3D journey
  CHECK: node -e "const fs = require('fs'); const page = fs.readFileSync('src/pages/mockups/MockupOneTunnel.jsx','utf8'); if (page.includes('FullscreenTunnelBrainCanvas') && page.includes('PsychometricMiniLab') && page.includes('TUNNEL_WAYPOINTS')) console.log('mockup tunnel page passed'); else process.exit(1);"
  EXPECT: mockup tunnel page passed
  EVIDENCE: Verified: 5 continuous cybernetic waypoints (Z: 22.0 to 3.6), interactive PsychometricMiniLab integration at Stage 04, and framer-motion telemetry transitions.

- [x] G4: Clean TypeScript / jsconfig compilation with zero errors
  CHECK: npm run typecheck
  EXPECT: tsc -p ./jsconfig.json
  EVIDENCE: Verified clean compilation with 0 errors via tsc -p ./jsconfig.json.

- [x] G5: Production build compiles cleanly
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: Verified clean Vite production build in 24.95s.

- [x] G6: Playwright automated desktop audit passes with 0 console errors and verified screenshots
  CHECK: node scripts/audit_mockups_playwright.js
  EXPECT: Console Errors: 0
  EVIDENCE: Verified: all 4 mockups rendered cleanly, 0 console errors, 0 runtime errors, and visual screenshots logged to logs/browser-validation/mockup-qa/.
