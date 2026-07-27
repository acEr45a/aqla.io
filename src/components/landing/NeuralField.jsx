import React, { useEffect, useRef } from "react";

// Ambient drifting neural particle field — connects nearby nodes, reacts gently to the cursor.
export default function NeuralField({ className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf, w, h;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();

    const N = Math.min(70, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 16000));
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
      r: (0.8 + Math.random() * 1.6) * devicePixelRatio,
      hue: Math.random() < 0.25 ? "201,242,78" : Math.random() < 0.5 ? "123,148,255" : "230,228,220",
    }));

    const LINK = 130 * devicePixelRatio;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        // gentle cursor attraction
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 220 * devicePixelRatio && dist > 1) {
          p.vx += (dx / dist) * 0.012 * devicePixelRatio;
          p.vy += (dy / dist) * 0.012 * devicePixelRatio;
        }
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(${a.hue},${(1 - d / LINK) * 0.14})`;
            ctx.lineWidth = devicePixelRatio * 0.6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = `rgba(${p.hue},0.55)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * devicePixelRatio;
      mouse.y = (e.clientY - rect.top) * devicePixelRatio;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} aria-hidden="true" />;
}