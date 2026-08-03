import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const PHI = (1 + Math.sqrt(5)) / 2;

// 12 vertices of a unit icosahedron (golden-ratio coordinates)
const VERTICES = [
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, 1], [-PHI, 0, -1],
];

// Precompute 30 edges (pairs at edge-length = 2)
const EDGES = [];
for (let i = 0; i < VERTICES.length; i++) {
  for (let j = i + 1; j < VERTICES.length; j++) {
    const dx = VERTICES[i][0] - VERTICES[j][0];
    const dy = VERTICES[i][1] - VERTICES[j][1];
    const dz = VERTICES[i][2] - VERTICES[j][2];
    if (Math.abs(Math.sqrt(dx * dx + dy * dy + dz * dz) - 2) < 0.01) {
      EDGES.push([i, j]);
    }
  }
}

function rotateY(v, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}
function rotateX(v, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

export default function IcosahedronWire({ color = "hsl(75 82% 60%)" }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");

    // Performance tiers
    const cores = navigator.hardwareConcurrency || 4;
    const lowPower = cores <= 4;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetFps = lowPower ? 24 : 60;
    const frameMs = 1000 / targetFps;

    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR for perf
      const px = container.offsetWidth;
      canvas.width = px * dpr;
      canvas.height = px * dpr;
      canvas.style.width = px + "px";
      canvas.style.height = px + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return px;
    };

    let size = setupCanvas();

    const drawFrame = (ay, ax) => {
      const sc = size * 0.2;
      const cx = size / 2;
      const cy = size / 2;
      ctx.clearRect(0, 0, size, size);

      const projected = VERTICES.map((v) => {
        let p = rotateY(v, ay);
        p = rotateX(p, ax);
        const persp = 1 / (1 + p[2] * 0.12);
        return { x: cx + p[0] * sc * persp, y: cy + p[1] * sc * persp, z: p[2] };
      });

      // Edges with depth-based opacity
      EDGES.forEach(([i, j]) => {
        const a = projected[i];
        const b = projected[j];
        const t = ((a.z + b.z) / 2 + PHI) / (2 * PHI);
        ctx.globalAlpha = 0.12 + t * 0.68;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // Vertex dots
      projected.forEach((p) => {
        const t = (p.z + PHI) / (2 * PHI);
        ctx.globalAlpha = 0.25 + t * 0.75;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    };

    let angleY = 0;
    let angleX = 0.35;
    let raf;
    let lastT = 0;
    let visible = true;

    // Pause rendering when off-screen
    const observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
    observer.observe(container);

    const onResize = () => {
      size = setupCanvas();
      drawFrame(angleY, angleX);
    };
    window.addEventListener("resize", onResize);

    // Draw initial static frame immediately
    drawFrame(angleY, angleX);

    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (!visible || reducedMotion) return;
      if (t - lastT < frameMs) return;
      lastT = t;
      angleY += 0.006;
      angleX += 0.002;
      drawFrame(angleY, angleX);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [color]);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-24 h-24 md:w-36 md:h-36 shrink-0"
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: false, margin: "-20% 0px -20% 0px" }}
      transition={{ duration: 0.6 }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </motion.div>
  );
}