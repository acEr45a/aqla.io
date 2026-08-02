import React, { useRef, useEffect } from "react";
import BrainProfileMap from "./BrainProfileMap";

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
    target.current.x = Math.max(-18, Math.min(18, target.current.x + dy * 0.3));
    target.current.y = Math.max(-22, Math.min(22, target.current.y - dx * 0.3));
  };

  const up = () => {
    dragging.current = false;
    if (interactRef.current) interactRef.current.style.pointerEvents = "";
  };

  return (
    <div
      className="relative w-full h-full cursor-grab active:cursor-grabbing touch-none"
      style={{ perspective: "1000px" }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
    >
      <div
        ref={sceneRef}
        className="w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div ref={interactRef} className="w-full h-full">
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