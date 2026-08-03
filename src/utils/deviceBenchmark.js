// Device capability benchmark — runs once, caches result.
// Measures actual rendering throughput + hardware hints to assign a performance tier.
// Tier 2 = high, 1 = balanced, 0 = low.  No UI mention anywhere.

let _tier = null;

function runBenchmark() {
  // 1. Canvas rendering throughput (most reliable real-world indicator)
  let canvasScore = 0;
  try {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 200;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#fff";
      const start = performance.now();
      while (performance.now() - start < 40) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 200, Math.random() * 200);
        ctx.lineTo(Math.random() * 200, Math.random() * 200);
        ctx.lineWidth = 2;
        ctx.stroke();
        canvasScore++;
      }
    }
  } catch {
    /* canvas not available */
  }

  // 2. Hardware hints
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const dpr = window.devicePixelRatio || 1;
  const conn = (navigator.connection || navigator.mozConnection)?.effectiveType || "4g";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isTouch = "ontouchstart" in window;

  // 3. Weighted scoring
  let score = 0;

  // Canvas throughput — 40% weight
  if (canvasScore > 5000) score += 40;
  else if (canvasScore > 2000) score += 25;
  else if (canvasScore > 800) score += 15;
  else score += 5;

  // CPU cores — 25% weight
  if (cores >= 8) score += 25;
  else if (cores >= 4) score += 15;
  else if (cores >= 2) score += 8;
  else score += 3;

  // RAM — 20% weight
  if (memory >= 8) score += 20;
  else if (memory >= 4) score += 12;
  else score += 5;

  // Display / form factor — 15% weight
  if (!isMobile && dpr <= 1.5) score += 15;
  else if (!isMobile) score += 10;
  else if (dpr <= 2) score += 8;
  else score += 4;

  // Slow connection penalty
  if (conn === "2g" || conn === "slow-2g") score -= 10;

  if (score >= 80) return 2;
  if (score >= 45) return 1;
  return 0;
}

export function getDeviceTier() {
  if (_tier !== null) return _tier;
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    _tier = 0;
    return 0;
  }
  _tier = runBenchmark();
  return _tier;
}

export function getPerfSettings() {
  const tier = getDeviceTier();
  if (tier >= 2)
    return { fps: 60, dprCap: 2, glow: true, branches: 5, shadowBlur: 14 };
  if (tier === 1)
    return { fps: 45, dprCap: 1.5, glow: true, branches: 3, shadowBlur: 8 };
  return { fps: 30, dprCap: 1, glow: false, branches: 1, shadowBlur: 0 };
}