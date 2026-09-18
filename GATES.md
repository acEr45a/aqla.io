# GATES.md — 3 Perfection Mockups with Anime.js & 3D WebGL (/unlazy)

## Gate 1: Fullscreen 3D Synapse Tunnel & Camera Trajectory (Mockup 1)
- **Outcome**: `MockupOneTunnel.jsx` and `FullscreenTunnelBrainCanvas.jsx` render a fullscreen 3D WebGL universe with volumetric depth fog, 1,400 tunnel particles, axon nerve cables stretching to Z=24, and Anime.js/lerp-damped camera swoop traversing from deep tunnel into prefrontal close-up and dorsal overhead domain map.
- **Verification**: Canvas mounts without WebGL context loss, responds to scroll events with smooth camera coordinates, and displays 8 interactive cortical domain nodes.

## Gate 2: Holographic Cyber-Matrix & Interactive Memory Lab (Mockup 2)
- **Outcome**: `MockupTwoMatrix.jsx` features a dark-tech neuro-laboratory terminal with animated SVG scanning lines, a live 3D brain radar dish, a dynamic morphing 8-domain radar/frequency matrix, and a functional Wechsler Digit Span 6-digit memory trial.
- **Verification**: User can trigger the 6-digit memory trial, observe the 3-second countdown, enter their recall, and receive real-time working memory buffer calibration.

## Gate 3: Clinical Luxury & 24-Hour Circadian Dial (Mockup 3)
- **Outcome**: `MockupThreeLuxury.jsx` features a high-end "Dark Nature" aesthetic (Obsidian & Emerald), an interactive 24-hour circular circadian dial with brushed gold markers and Anime.js elastic rotation, and a graded clinical evidence passport with study citations and effect sizes.
- **Verification**: Quadrant clicks rotate the circadian dial smoothly with Anime.js `easeOutElastic` and display phase protocols.

## Gate 4: Universal Mockup Switcher Dock
- **Outcome**: `MockupSwitcherDock.jsx` is rendered as a docked floating glass pill across all mockups, allowing 1-click seamless navigation between `/mockup-1`, `/mockup-2`, `/mockup-3`, and production `/`.
- **Verification**: Clicking any switcher tab navigates to the respective route with active pill highlight.

## Gate 5: Responsive & Motion Hygiene
- **Outcome**: Zero scroll-trapping `overflow` bugs on parent containers; full responsiveness on mobile, tablet, and desktop; high-contrast buttons; zero placeholder/truncated code.
- **Verification**: Clean DOM hierarchy with responsive grid classes and accessible text contrast.

## Gate 6: Build & Type Integrity
- **Outcome**: `npm run typecheck` and `npm run build` succeed with exit code 0.
- **Verification**: Automated validation commands exit code 0 with all assets properly code-split.
