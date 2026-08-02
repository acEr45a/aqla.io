import React, { useRef, useEffect } from "react";
import BrainProfileMap from "./BrainProfileMap";

// AI-generated 3D volumetric brain render — full 3D mesh appearance,
// three-quarter view showing both hemispheres for true 360° depth.
const BRAIN_3D =
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/ebe149cae_generated_image.png";

// Volumetric depth slices — the 3D brain render duplicated at different Z depths.
// When rotated, layers parallax apart to create real perceived volume.
const DEPTH_LAYERS = [
  { z: -80, opacity: 0.1, blur: 8 },
  { z: -56, opacity: 0.16, blur: 6 },
  { z: -36, opacity: 0.26, blur: 4 },
  { z: -18, opacity: 0.4, blur: 2 },
  { z: 18, opacity: 0.4, blur: 2 },
  { z: 36, opacity: 0.26, blur: 4 },
  { z: 56, opacity: 0.16, blur: 6 },
  { z: 80, opacity: 0.1, blur: 8 },
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
      {/* Volumetric 3D brain — full-frame render with parallax depth layers */}
      <div
        ref={sceneRef}
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        {DEPTH_LAYERS.map((layer, i) => (
          <div
            key={layer.z}
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translateZ(${layer.z}px)`,
              opacity: layer.opacity,
              filter: `blur(${layer.blur}px)`,
              mixBlendMode: i < 4 ? "normal" : "screen",
            }}
          >
            <img
              src={BRAIN_3D}
              alt=""
              className="w-full h-full object-contain"
              draggable="false"
            />
          </div>
        ))}

        {/* Center interaction layer — SVG region fills + hit detection */}
        <div
          ref={interactRef}
          className="absolute inset-0"
          style={{ transform: "translateZ(0px)" }}
        >
          <BrainProfileMap
            domains={domains}
            activeKey={activeKey}
            onHover={onHover}
            onSelect={onSelect}
          />
        </div>
      </div>
    </div>
  );
}