import React, { useEffect, useRef, useState } from "react";

export const BRAIN_FRAMES = [
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/e717df4e3_generated_image.png",
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/1971e0539_generated_image.png",
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/9eb924d81_generated_image.png",
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/37a345373_generated_image.png",
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/5f5028bdf_generated_image.png",
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/18b1ab084_generated_image.png",
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/e64c32d8b_generated_image.png",
  "https://media.base44.com/images/public/6a670dff96c46b62aaca0b7d/27003c111_generated_image.png",
];

const DEG_PER_FRAME = 360 / BRAIN_FRAMES.length;

export default function BrainTurntable({ onAngleChange }) {
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    BRAIN_FRAMES.forEach((src) => { const img = new window.Image(); img.src = src; });
  }, []);

  useEffect(() => { onAngleChange?.(angle); }, [angle, onAngleChange]);

  useEffect(() => {
    if (dragging) return;
    const id = setInterval(() => setAngle((a) => (a + 0.5) % 360), 40);
    return () => clearInterval(id);
  }, [dragging]);

  const start = (x) => { drag.current = { x, angle }; setDragging(true); };
  const move = (x) => {
    if (!drag.current) return;
    const next = drag.current.angle + (x - drag.current.x) * 0.55;
    setAngle(((next % 360) + 360) % 360);
  };
  const end = () => { drag.current = null; setDragging(false); };

  const frame = Math.round(angle / DEG_PER_FRAME) % BRAIN_FRAMES.length;

  return (
    <div
      className={`absolute inset-0 touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start(e.clientX); }}
      onPointerMove={(e) => move(e.clientX)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {BRAIN_FRAMES.map((src, i) => (
        <img key={src} src={src} alt="" draggable={false}
          className="absolute inset-[6%] h-[88%] w-[88%] object-contain transition-opacity duration-150"
          style={{ opacity: i === frame ? 1 : 0 }} />
      ))}
    </div>
  );
}