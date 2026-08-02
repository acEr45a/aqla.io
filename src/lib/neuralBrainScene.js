// 3D neural brain renderer — Canvas 2D point cloud with volumetric soft auras.
// Each cognitive domain glows from within as a depth-sorted radial gradient.
// Clamped orbit for static inspection; hit detection powers hover tooltips.

const REGION_CENTERS = {
  focus: [-1.55, 0.45, 0.15], mental_energy: [-0.75, 1.05, 0.2],
  cognitive_resilience: [0.25, 0.9, 0.4], learning_capacity: [1.45, 0.45, 0.1],
  stress_regulation: [0.05, 0.05, 0.85], memory: [-0.55, -0.55, 0.35],
  sleep_recovery: [0.15, -1.55, 0], lifestyle_protection: [1.25, -0.75, 0.3],
};

const nearest = (point, domains) => domains.reduce((best, domain) => {
  const center = REGION_CENTERS[domain.key] || [0, 0, 0];
  const distance = Math.hypot(point.x - center[0], point.y - center[1], point.z - center[2]);
  return !best || distance < best.distance ? { domain, distance } : best;
}, null)?.domain;

// Cerebrum lobes shaped to a lateral brain profile (x-: anterior, x+: posterior).
const LOBES = [
  { weight: 0.24, center: [-1.3, 0.25, 0], radii: [1.0, 1.02, 0.82], seed: 1.3 },
  { weight: 0.24, center: [-0.1, 0.8, 0], radii: [1.3, 0.92, 0.92], seed: 3.1 },
  { weight: 0.18, center: [1.35, 0.35, 0], radii: [0.98, 0.88, 0.78], seed: 5.4 },
  { weight: 0.24, center: [-0.35, -0.42, 0.04], radii: [1.3, 0.6, 0.82], seed: 7.2 },
  { weight: 0.1, center: [0.7, -0.2, 0], radii: [0.9, 0.7, 0.78], seed: 9.8 },
];

function gyriField(u, v, seed) {
  return Math.sin(u * 6 + Math.sin(v * 4 + u * 2) * 1.6 + seed) * Math.cos(v * 3.2 + seed);
}

function cerebrumPoint() {
  let cursor = Math.random();
  const lobe = LOBES.find((entry) => ((cursor -= entry.weight) <= 0)) || LOBES[0];
  const u = Math.random() * Math.PI * 2;
  const v = Math.asin(Math.random() * 2 - 1);
  const g = gyriField(u, v, lobe.seed);
  if (Math.random() > 0.25 + 0.75 * g * g) return null;
  const bulge = 1 + 0.055 * g + 0.02 * Math.sin(u * 15 - v * 9);
  const point = {
    x: lobe.center[0] + lobe.radii[0] * Math.cos(v) * Math.cos(u) * bulge,
    y: lobe.center[1] + lobe.radii[1] * Math.sin(v) * bulge,
    z: lobe.center[2] + lobe.radii[2] * Math.cos(v) * Math.sin(u) * bulge,
  };
  if (point.y > 0.55 && Math.abs(point.z) < 0.07 && Math.random() < 0.85) return null;
  if (point.y < -1.05 && point.x > 0.2) return null;
  return point;
}

function cerebellumPoint() {
  const u = Math.random() * Math.PI * 2;
  const v = Math.asin(Math.random() * 2 - 1);
  const band = Math.sin(v * 16);
  if (Math.random() > 0.2 + 0.8 * band * band) return null;
  const bulge = 1 + 0.035 * band;
  return {
    x: 1.2 + 0.78 * Math.cos(v) * Math.cos(u) * bulge,
    y: -0.95 + 0.52 * Math.sin(v) * bulge,
    z: 0.62 * Math.cos(v) * Math.sin(u) * bulge,
  };
}

function brainstemPoint() {
  const t = Math.random();
  const angle = Math.random() * Math.PI * 2;
  const radius = (0.22 - 0.09 * t) * Math.sqrt(Math.random());
  return {
    x: 0.35 + 0.3 * t + radius * Math.cos(angle),
    y: -0.85 - 1.05 * t,
    z: radius * Math.sin(angle),
  };
}

function createPoints(domains, rankFor) {
  const points = [];
  let attempts = 0;
  while (points.length < 13000 && attempts < 60000) {
    attempts += 1;
    const part = Math.random();
    const point = part < 0.84 ? cerebrumPoint() : part < 0.95 ? cerebellumPoint() : brainstemPoint();
    if (!point) continue;
    const domain = nearest(point, domains);
    if (domain) {
      const center = REGION_CENTERS[domain.key];
      const dist = Math.hypot(point.x - center[0], point.y - center[1], point.z - center[2]);
      point.proximity = Math.max(0, Math.min(1, 1 - dist / 1.8));
      point.rankColor = rankFor(domain.score).color;
    } else {
      point.proximity = 0;
      point.rankColor = "#888888";
    }
    points.push(point);
  }
  return points;
}

const rotate = (point, rotationX, rotationY) => {
  const cy = Math.cos(rotationY); const sy = Math.sin(rotationY);
  const cx = Math.cos(rotationX); const sx = Math.sin(rotationX);
  const x = point.x * cy - point.z * sy;
  const z1 = point.x * sy + point.z * cy;
  return { x, y: point.y * cx - z1 * sx, z: point.y * sx + z1 * cx, proximity: point.proximity, rankColor: point.rankColor };
};

function hexToRgb(hex) {
  if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

const CLAMP_Y = 0.42;
const CLAMP_X = 0.42;

export function mountNeuralBrain(canvas, domains, rankFor, onHover, onSelect) {
  const context = canvas.getContext("2d");
  const points = createPoints(domains, rankFor);
  const domainByKey = {};
  domains.forEach((d) => { domainByKey[d.key] = d; });

  let targetRotX = -0.1, targetRotY = -0.22;
  let rotationX = -0.1, rotationY = -0.22;
  let isDragging = false, dragMoved = false;
  let frame;
  let previous = { x: 0, y: 0 };
  let mouse = { x: 0, y: 0, active: false };
  let hoveredKey = null;
  let hoverPending = false;
  let lastReportPos = { x: 0, y: 0 };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const projectRegion = (key) => {
    const center = REGION_CENTERS[key];
    if (!center) return null;
    const r = rotate({ x: center[0], y: center[1], z: center[2], proximity: 0, rankColor: "" }, rotationX, rotationY);
    const w = canvas.width, h = canvas.height;
    const scale = Math.min(w / 6.2, h / 4.8);
    const persp = 6.5 / (6.5 + r.z);
    return { x: w / 2 + r.x * scale * persp, y: h / 2 - r.y * scale * persp, z: r.z, persp, scale };
  };

  const reportHover = (key) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!key) {
      if (hoveredKey) { hoveredKey = null; onHover?.(null); }
      return;
    }
    hoveredKey = key;
    lastReportPos = { x: mouse.x, y: mouse.y };
    onHover?.({ key, x: mouse.x, y: mouse.y });
  };

  const detectHover = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mx = mouse.x * dpr;
    const my = mouse.y * dpr;
    let bestKey = null;
    let bestDist = Infinity;
    domains.forEach((domain) => {
      const proj = projectRegion(domain.key);
      if (!proj) return;
      const dist = Math.hypot(proj.x - mx, proj.y - my);
      if (dist < bestDist) { bestDist = dist; bestKey = domain.key; }
    });
    const threshold = 115 * dpr;
    const newKey = bestDist < threshold ? bestKey : null;
    if (newKey !== hoveredKey) {
      reportHover(newKey);
    } else if (newKey) {
      const dx = Math.abs(mouse.x - lastReportPos.x);
      const dy = Math.abs(mouse.y - lastReportPos.y);
      if (dx > 3 || dy > 3) reportHover(newKey);
    }
  };

  const down = (event) => {
    isDragging = true;
    dragMoved = false;
    previous = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    if (hoveredKey) { hoveredKey = null; onHover?.(null); }
  };

  const move = (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
    if (isDragging) {
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
      targetRotY = Math.max(-CLAMP_Y, Math.min(CLAMP_Y, targetRotY + dx * 0.006));
      targetRotX = Math.max(-CLAMP_X, Math.min(CLAMP_X, targetRotX + dy * 0.005));
      previous = { x: event.clientX, y: event.clientY };
    } else {
      if (!hoverPending) {
        hoverPending = true;
        requestAnimationFrame(() => {
          hoverPending = false;
          if (!isDragging && mouse.active) detectHover();
        });
      }
    }
  };

  const up = () => {
    if (isDragging && !dragMoved && mouse.active) {
      detectHover();
      if (hoveredKey && onSelect) onSelect(domainByKey[hoveredKey]);
    }
    isDragging = false;
  };

  const leave = () => {
    mouse.active = false;
    if (hoveredKey) { hoveredKey = null; onHover?.(null); }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointerleave", leave);

  const render = () => {
    frame = requestAnimationFrame(render);
    rotationX += (targetRotX - rotationX) * 0.12;
    rotationY += (targetRotY - rotationY) * 0.12;

    const w = canvas.width, h = canvas.height;
    context.clearRect(0, 0, w, h);
    const scale = Math.min(w / 6.2, h / 4.8);
    const cx = w / 2, cy = h / 2;
    const persp = (z) => 6.5 / (6.5 + z);

    // Ambient core glow behind the brain
    context.globalCompositeOperation = "lighter";
    const coreGrad = context.createRadialGradient(cx, cy, 0, cx, cy, scale * 2.2);
    coreGrad.addColorStop(0, "rgba(123,148,255,0.05)");
    coreGrad.addColorStop(0.5, "rgba(123,148,255,0.02)");
    coreGrad.addColorStop(1, "rgba(123,148,255,0)");
    context.fillStyle = coreGrad;
    context.fillRect(0, 0, w, h);

    // Build depth-sorted render list: points + auras interleaved
    const items = [];
    points.forEach((p) => {
      const r = rotate(p, rotationX, rotationY);
      const pp = persp(r.z);
      items.push({
        type: "point", z: r.z,
        x: cx + r.x * scale * pp, y: cy - r.y * scale * pp, persp: pp, point: p,
      });
    });
    domains.forEach((domain) => {
      const proj = projectRegion(domain.key);
      if (!proj) return;
      items.push({ type: "aura", z: proj.z, x: proj.x, y: proj.y, persp: proj.persp, domain });
    });
    items.sort((a, b) => a.z - b.z);

    const clientW = Math.max(canvas.clientWidth, 1);

    items.forEach((item) => {
      if (item.type === "point") {
        const p = item.point;
        const proximity = p.proximity || 0;
        const radius = Math.max(0.5, (0.85 + proximity * 0.4) * item.persp * (w / clientW));
        const depthAlpha = 0.18 + item.persp * 0.38 + proximity * 0.12;
        const tint = 0.12 + proximity * 0.28;
        const rgb = hexToRgb(p.rankColor || "#888888");
        const neutral = 125;
        const rr = Math.round(neutral * (1 - tint) + rgb.r * tint);
        const gg = Math.round(neutral * (1 - tint) + rgb.g * tint);
        const bb = Math.round(neutral * (1 - tint) + rgb.b * tint);
        context.globalAlpha = depthAlpha;
        context.fillStyle = `rgb(${rr},${gg},${bb})`;
        context.beginPath();
        context.arc(item.x, item.y, radius, 0, Math.PI * 2);
        context.fill();
      } else {
        const domain = item.domain;
        const rank = rankFor(domain.score);
        const isHovered = hoveredKey === domain.key;
        const intensity = 0.3 + 0.7 * (domain.score / 100);
        const boost = isHovered ? 1.45 : 1;
        const auraRadius = (0.55 + 0.55 * intensity) * scale * item.persp * boost;
        const opacity = (0.28 + 0.32 * intensity) * boost;
        const rgb = hexToRgb(rank.color);

        const grad = context.createRadialGradient(item.x, item.y, 0, item.x, item.y, auraRadius);
        grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})`);
        grad.addColorStop(0.35, `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity * 0.35})`);
        grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        context.globalAlpha = 1;
        context.fillStyle = grad;
        context.beginPath();
        context.arc(item.x, item.y, auraRadius, 0, Math.PI * 2);
        context.fill();

        if (isHovered) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const coreR = 5 * item.persp * dpr;
          const coreGrad = context.createRadialGradient(item.x, item.y, 0, item.x, item.y, coreR * 3);
          coreGrad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.95)`);
          coreGrad.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);
          coreGrad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
          context.fillStyle = coreGrad;
          context.beginPath();
          context.arc(item.x, item.y, coreR * 3, 0, Math.PI * 2);
          context.fill();
        }
      }
    });

    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
  };

  render();

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointerleave", leave);
  };
}