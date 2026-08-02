import React, { useEffect, useRef } from "react";
import { mountNeuralBrain } from "@/lib/neuralBrainScene";
import { rankFor } from "@/lib/ranks";

export default function NeuralBrainCanvas({ domains, onHover, onSelect }) {
  const canvasRef = useRef(null);
  const hoverRef = useRef(onHover);
  const selectRef = useRef(onSelect);
  hoverRef.current = onHover;
  selectRef.current = onSelect;

  useEffect(() => {
    if (!canvasRef.current || !domains.length) return undefined;
    return mountNeuralBrain(
      canvasRef.current,
      domains,
      rankFor,
      (h) => hoverRef.current?.(h),
      (d) => selectRef.current?.(d)
    );
  }, [domains]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Interactive 3D neural brain model. Drag to inspect, hover for details."
      className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
    />
  );
}