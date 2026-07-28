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
  { weight: 0.24, center: [-1.3, 0.25, 0], radii: [1.0, 1.02, 0.82], seed: 1.3 },   // frontal
  { weight: 0.24, center: [-0.1, 0.8, 0], radii: [1.3, 0.92, 0.92], seed: 3.1 },    // parietal crown
  { weight: 0.18, center: [1.35, 0.35, 0], radii: [0.98, 0.88, 0.78], seed: 5.4 },  // occipital
  { weight: 0.24, center: [-0.35, -0.42, 0.04], radii: [1.3, 0.6, 0.82], seed: 7.2 }, // temporal (hangs low)
  { weight: 0.1, center: [0.7, -0.2, 0], radii: [0.9, 0.7, 0.78], seed: 9.8 },      // posterior-inferior fill
];

// Gyri: points cluster along winding ridge bands and bulge outward on them.
function gyriField(u, v, seed) {
  return Math.sin(u * 6 + Math.sin(v * 4 + u * 2) * 1.6 + seed) * Math.cos(v * 3.2 + seed);
}

function cerebrumPoint() {
  let cursor = Math.random();
  const lobe = LOBES.find((entry) => ((cursor -= entry.weight) <= 0)) || LOBES[0];
  const u = Math.random() * Math.PI * 2;
  const v = Math.asin(Math.random() * 2 - 1);
  const g = gyriField(u, v, lobe.seed);
  // Reject points between ridges so the stripes read as folded gyri.
  if (Math.random() > 0.25 + 0.75 * g * g) return null;
  const bulge = 1 + 0.055 * g + 0.02 * Math.sin(u * 15 - v * 9);
  const point = {
    x: lobe.center[0] + lobe.radii[0] * Math.cos(v) * Math.cos(u) * bulge,
    y: lobe.center[1] + lobe.radii[1] * Math.sin(v) * bulge,
    z: lobe.center[2] + lobe.radii[2] * Math.cos(v) * Math.sin(u) * bulge,
  };
  // Longitudinal fissure: thin the midline on top of the cerebrum.
  if (point.y > 0.55 && Math.abs(point.z) < 0.07 && Math.random() < 0.85) return null;
  // Keep the underside clean where the temporal lobe meets the stem.
  if (point.y < -1.05 && point.x > 0.2) return null;
  return point;
}

function cerebellumPoint() {
  const u = Math.random() * Math.PI * 2;
  const v = Math.asin(Math.random() * 2 - 1);
  // Fine horizontal striations, the cerebellum's signature texture.
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
  while (points.length < 12500 && attempts < 60000) {
    attempts += 1;
    const part = Math.random();
    const point = part < 0.84 ? cerebrumPoint() : part < 0.95 ? cerebellumPoint() : brainstemPoint();
    if (!point) continue;
    point.color = rankFor(nearest(point, domains)?.score || 0).color;
    points.push(point);
  }
  return points;
}

const rotate = (point, rotationX, rotationY) => {
  const cy = Math.cos(rotationY); const sy = Math.sin(rotationY);
  const cx = Math.cos(rotationX); const sx = Math.sin(rotationX);
  const x = point.x * cy - point.z * sy;
  const z1 = point.x * sy + point.z * cy;
  return { x, y: point.y * cx - z1 * sx, z: point.y * sx + z1 * cx, color: point.color };
};

export function mountNeuralBrain(canvas, domains, rankFor) {
  const context = canvas.getContext("2d");
  const points = createPoints(domains, rankFor);
  let rotationX = -0.08; let rotationY = -0.18;
  let dragging = false; let frame; let previous = { x: 0, y: 0 };
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas); resize();
  const down = (event) => { dragging = true; previous = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); };
  const move = (event) => {
    if (!dragging) return;
    rotationY += (event.clientX - previous.x) * 0.008;
    rotationX = Math.max(-0.65, Math.min(0.65, rotationX + (event.clientY - previous.y) * 0.006));
    previous = { x: event.clientX, y: event.clientY };
  };
  const up = () => { dragging = false; };
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up);
  const render = () => {
    frame = requestAnimationFrame(render);
    const width = canvas.width; const height = canvas.height;
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width / 6.2, height / 4.8);
    const projected = points.map((point) => rotate(point, rotationX, rotationY)).sort((a, b) => a.z - b.z);
    context.globalCompositeOperation = "lighter";
    projected.forEach((point) => {
      const perspective = 6.5 / (6.5 + point.z);
      const x = width / 2 + point.x * scale * perspective;
      const y = height / 2 - point.y * scale * perspective;
      const radius = Math.max(0.7, 1.25 * perspective * (width / Math.max(canvas.clientWidth, 1)));
      context.globalAlpha = 0.44 + perspective * 0.35;
      context.fillStyle = point.color;
      context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
    });
    context.globalCompositeOperation = "source-over"; context.globalAlpha = 1;
  };
  render();
  return () => {
    cancelAnimationFrame(frame); observer.disconnect();
    canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up);
  };
}