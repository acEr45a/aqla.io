import React, { useRef, useEffect } from "react";
import BrainProfileMap from "./BrainProfileMap";

const GLASS_BRAIN =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/a452d7eb7_generated_image.png";

// Volumetric depth slices — each layer is the brain image at a different Z depth.
// When rotated, layers parallax apart to create real perceived volume.
const DEPTH_LAYERS = [
  { z: -70, opacity: 0.12, blur: 7 },
  { z: -50, opacity: 0.18, blur: 5 },
  { z: -32, opacity: 0.28, blur: 3 },
  { z: -16, opacity: 0.4, blur: 1.5 },
  { z: 16, opacity: 0.35, blur: 1.5 },
  { z: 32, opacity: 0.22, blur: 3 },
  { z: 50, opacity: 0.14, blur: 5 },
  { z: 70, opacity: 0.08, blur: 7 },
];

export default function Brain3DView({ domains, activeKey, onHover, onSelect }) {
  const sceneRef = useRef(null);
  const interactRef = useRef(null);
  const target = useRef({ x: -5, y: 4 });
  const current = useRef({ x: -5, y: 4 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const raf = useRef(null);
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;

  useEffect(() => {
    const loop = () => {
      raf.current = requestAnimationFrame(loop);
      current.current.x += (target.current.x - current.current.x) * 0.1;
      current.current.y += (target.current.y - current.current.y) * 0.1;
      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `rotateX(${current.current.x}deg) rotateY(${current.current.y}deg)`;
      }
    };
    loop();
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const down = (e) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    if (interactRef.current) interactRef.current.style.pointerEvents = "none";
    onHoverRef.current?.(null);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const move = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    target.current.x = Math.max(-45, Math.min(45, target.current.x + dy * 0.3));
    target.current.y += dx * 0.3;
  };

  const up = () => {
    dragging.current = false;
    if (interactRef.current) interactRef.current.style.pointerEvents = "";
  };

  return (
    <div
      className="relative w-full h-full cursor-grab active:cursor-grabbing touch-none"
      style={{ perspective: "900px" }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
    >
      <div
        ref={sceneRef}
        className="w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Back depth slices */}
        {DEPTH_LAYERS.filter((l) => l.z < 0).map((layer) => (
          <div
            key={`back-${layer.z}`}
            className="absolute pointer-events-none"
            style={{
              left: "12.1%", top: "12.5%", width: "75.8%", height: "82.1%",
              transform: `translateZ(${layer.z}px)`,
              opacity: layer.opacity,
              filter: `blur(${layer.blur}px) brightness(0.65)`,
            }}
          >
            <img src={GLASS_BRAIN} alt="" className="w-full h-full object-cover" draggable="false" />
          </div>
        ))}

        {/* Center interaction layer with fills + brain */}
        <div ref={interactRef} className="w-full h-full" style={{ transform: "translateZ(0px)" }}>
          <BrainProfileMap
            domains={domains}
            activeKey={activeKey}
            onHover={onHover}
            onSelect={onSelect}
          />
        </div>

        {/* Front depth slices */}
        {DEPTH_LAYERS.filter((l) => l.z > 0).map((layer) => (
          <div
            key={`front-${layer.z}`}
            className="absolute pointer-events-none"
            style={{
              left: "12.1%", top: "12.5%", width: "75.8%", height: "82.1%",
              transform: `translateZ(${layer.z}px)`,
              opacity: layer.opacity,
              filter: `blur(${layer.blur}px)`,
              mixBlendMode: "screen",
            }}
          >
            <img src={GLASS_BRAIN} alt="" className="w-full h-full object-cover" draggable="false" />
          </div>
        ))}
      </div>
    </div>
  );
}