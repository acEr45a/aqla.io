import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { animate } from "animejs";

/**
 * PageTransitionCurtain
 * Provides an Unseen Studio-inspired cinematic obsidian curtain wipe
 * across route transitions to prevent any white screen or jarring DOM flashes.
 */
export default function PageTransitionCurtain() {
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const curtainRef = useRef(null);
  const beamRef = useRef(null);
  const textRef = useRef(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip on first initial landing mount to allow fast TTI
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (location.pathname === currentPath) return;

    const curtain = curtainRef.current;
    const beam = beamRef.current;
    const text = textRef.current;
    if (!curtain) return;

    // Reset visibility and initial position
    curtain.style.display = "flex";
    curtain.style.pointerEvents = "auto";
    curtain.style.opacity = "1";

    // Format destination label for subtle Unseen telemetry
    const targetName = location.pathname === "/"
      ? "CORE"
      : location.pathname.replace("/", "").toUpperCase();

    if (text) {
      text.innerText = `AQLA // ${targetName}`;
    }

    // Step 1: Sweep Curtain In (from bottom or scale)
    const animIn = animate(curtain, {
      scaleY: [0, 1],
      opacity: [0.8, 1],
      duration: 380,
      ease: "easeInOutCubic",
      onComplete: () => {
        // Update stored path state when curtain is completely covering the screen
        setCurrentPath(location.pathname);

        // Step 2: Animate horizontal scan beam
        if (beam) {
          animate(beam, {
            scaleX: [0, 1],
            opacity: [0.3, 1, 0.4],
            duration: 320,
            ease: "easeOutQuad",
          });
        }

        // Step 3: Hold 100ms for React chunk mount, then dissolve curtain away
        setTimeout(() => {
          animate(curtain, {
            opacity: [1, 0],
            scaleY: [1, 1.02],
            duration: 450,
            ease: "easeOutCubic",
            onComplete: () => {
              curtain.style.display = "none";
              curtain.style.pointerEvents = "none";
            }
          });
        }, 120);
      }
    });

    return () => {
      if (animIn && animIn.stop) animIn.stop();
    };
  }, [location.pathname, currentPath]);

  return (
    <div
      ref={curtainRef}
      className="fixed inset-0 z-[9999] pointer-events-none hidden flex-col items-center justify-center bg-[#06080c] origin-bottom overflow-hidden"
      style={{ transformOrigin: "bottom center" }}
      aria-hidden="true"
    >
      {/* Subtle Unseen refractive ambient glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.12)_0%,transparent_70%)]" />

      {/* 1px Luminescent Horizon Scan Beam */}
      <div
        ref={beamRef}
        className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#34d399] to-transparent opacity-0 origin-center"
        style={{ transformOrigin: "center center" }}
      />

      {/* Minimal Telemetry Tag */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <span
          ref={textRef}
          className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/50 select-none"
        >
          AQLA // TRANSITION
        </span>
        <div className="h-[2px] w-8 bg-emerald-400/40 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
