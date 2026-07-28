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

function createPoints(domains, rankFor) {
  return Array.from({ length: 10000 }, () => {
    const part = Math.random();
    const u = Math.random() * Math.PI * 2;
    const v = Math.asin(Math.random() * 2 - 1);
    const fold = 1 + 0.07 * Math.sin(u * 12 + Math.sin(v * 7)) * Math.cos(v * 9);
    let point;
    if (part < 0.82) {
      point = { x: 2.25 * Math.cos(v) * Math.cos(u) * fold, y: 1.48 * Math.sin(v) * fold + 0.3, z: 1.08 * Math.cos(v) * Math.sin(u) * fold };
    } else if (part < 0.95) {
      point = { x: 1.35 + 0.86 * Math.cos(v) * Math.cos(u) * fold, y: -0.92 + 0.58 * Math.sin(v) * fold, z: 0.72 * Math.cos(v) * Math.sin(u) * fold };
    } else {
      const t = Math.random(); const angle = Math.random() * Math.PI * 2; const radius = 0.2 * (1 - t * 0.45);
      point = { x: 0.52 + 0.22 * t + radius * Math.cos(angle), y: -1.12 - 1.22 * t, z: radius * Math.sin(angle) };
    }
    point.color = rankFor(nearest(point, domains)?.score || 0).color;
    return point;
  });
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
    if (!dragging) rotationY += 0.0007;
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