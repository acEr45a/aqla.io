import React, { useEffect, useRef } from "react";
import { mountNeuralBrain } from "@/lib/neuralBrainScene";
import { rankFor } from "@/lib/ranks";

export default function NeuralBrainCanvas({ domains }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !domains.length) return undefined;
    return mountNeuralBrain(canvasRef.current, domains, rankFor);
  }, [domains]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Interactive 3D neural brain model. Drag to rotate."
      className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
    />
  );
}