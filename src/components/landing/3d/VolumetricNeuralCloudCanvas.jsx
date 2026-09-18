import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Generate 22,000+ point-cloud coordinates arranged in dual-hemisphere cerebral cortex,
 * cerebellum, and brainstem structures with harmonic surface turbulence.
 */
function generateVolumetricBrainCloud(count = 22000) {
  const positions = new Float32Array(count * 3);
  const basePositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const colorCyan = new THREE.Color("#38bdf8");
  const colorLime = new THREE.Color("#bef264");
  const colorViolet = new THREE.Color("#a78bfa");

  for (let i = 0; i < count; i++) {
    // Determine anatomical region: 78% cerebral cortex, 15% cerebellum, 7% brainstem
    const regionRand = Math.random();
    let x, y, z;

    if (regionRand < 0.78) {
      // Dual-hemisphere cerebral cortex
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 1.35 * Math.cbrt(Math.random() * 0.4 + 0.6);

      let px = radius * Math.sin(phi) * Math.cos(theta);
      let py = radius * Math.sin(phi) * Math.sin(theta);
      let pz = radius * Math.cos(phi);

      // Deep sagittal fissure
      const fissure = Math.exp(-px * px * 14.0) * 0.28;

      // Sulci / gyri harmonic folds
      const fold = (Math.sin(px * 8.0 + py * 10.0) * Math.cos(pz * 7.5)) * 0.08;

      const r = Math.sqrt(px * px + py * py + pz * pz);
      const newR = r - fissure + fold;
      const factor = newR / (r || 1);

      x = px * factor * 1.25;
      y = py * factor * 0.92;
      z = pz * factor * 1.15;
    } else if (regionRand < 0.93) {
      // Cerebellum (posterior bottom cluster)
      const u = Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const cr = 0.55 * Math.cbrt(u);

      x = cr * Math.sin(phi) * Math.cos(theta) * 1.1;
      y = -0.65 + cr * Math.sin(phi) * Math.sin(theta) * 0.75;
      z = -0.55 + cr * Math.cos(phi) * 0.85;
    } else {
      // Brainstem / spinal projection
      const stemHeight = Math.random() * 0.85;
      const stemRadius = (1 - stemHeight * 0.5) * 0.18 * Math.sqrt(Math.random());
      const angle = Math.random() * Math.PI * 2;

      x = stemRadius * Math.cos(angle);
      y = -0.5 - stemHeight;
      z = -0.15 + stemRadius * Math.sin(angle);
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;

    // Color gradient based on cranial height and frontal position
    const mixedColor = new THREE.Color();
    if (z > 0.3) {
      mixedColor.copy(colorLime).lerp(colorCyan, (y + 1) * 0.5);
    } else if (y < -0.3) {
      mixedColor.copy(colorViolet).lerp(colorCyan, 0.4);
    } else {
      mixedColor.copy(colorCyan).lerp(colorLime, (x + 1) * 0.3);
    }

    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;

    sizes[i] = Math.random() * 0.024 + 0.012;
  }

  return { positions, basePositions, colors, sizes };
}

/**
 * High-performance 22,000+ particle cloud with cursor gravitational pull
 */
function VolumetricNeuralParticles({ mouse3D, scrollProgress }) {
  const pointsRef = useRef();
  const data = useMemo(() => generateVolumetricBrainCloud(22000), []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position.array;
    const base = data.basePositions;

    // Continuous orbital rotation with scroll acceleration
    const rotSpeed = 0.12 + scrollProgress.current * 0.8;
    pointsRef.current.rotation.y = t * rotSpeed;
    pointsRef.current.rotation.x = Math.sin(t * 0.3) * 0.08 + (scrollProgress.current * 1.1);

    // Gravitational cursor pull physics on a subset of particles for 60fps performance
    const mx = mouse3D.current.x * 2.5;
    const my = mouse3D.current.y * 2.5;
    const step = 4; // update every 4th particle for smooth fluid performance

    for (let i = 0; i < base.length; i += 3 * step) {
      const bx = base[i];
      const by = base[i + 1];
      const bz = base[i + 2];

      // Distance to cursor in 2D projection
      const dx = mx - bx;
      const dy = my - by;
      const distSq = dx * dx + dy * dy;

      if (distSq < 1.2) {
        // Gravitational attraction with falloff
        const force = (1.2 - distSq) * 0.18;
        pos[i] += (bx + dx * force - pos[i]) * 0.12;
        pos[i + 1] += (by + dy * force - pos[i + 1]) * 0.12;
      } else {
        // Elastic return to base anatomical coordinate
        pos[i] += (bx - pos[i]) * 0.08;
        pos[i + 1] += (by - pos[i + 1]) * 0.08;
      }
    }

    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.038}
        vertexColors
        transparent
        opacity={0.78}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Dynamic Electrical Synaptic Spark Lines connecting neural clusters
 */
function SynapticDischargeRays({ count = 36 }) {
  const linesRef = useRef();

  const [linePositions] = useMemo(() => {
    const pos = new Float32Array(count * 2 * 3);
    for (let i = 0; i < count; i++) {
      // Pick two randomized cluster points
      const r1 = 1.1 + Math.random() * 0.3;
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.acos(Math.random() * 2 - 1);

      const r2 = r1 + (Math.random() - 0.5) * 0.4;
      const theta2 = theta1 + (Math.random() - 0.5) * 0.5;
      const phi2 = phi1 + (Math.random() - 0.5) * 0.5;

      pos[i * 6] = r1 * Math.sin(phi1) * Math.cos(theta1);
      pos[i * 6 + 1] = r1 * Math.sin(phi1) * Math.sin(theta1);
      pos[i * 6 + 2] = r1 * Math.cos(phi1);

      pos[i * 6 + 3] = r2 * Math.sin(phi2) * Math.cos(theta2);
      pos[i * 6 + 4] = r2 * Math.sin(phi2) * Math.sin(theta2);
      pos[i * 6 + 5] = r2 * Math.cos(phi2);
    }
    return [pos];
  }, [count]);

  useFrame(({ clock }) => {
    if (!linesRef.current) return;
    const t = clock.getElapsedTime();
    linesRef.current.rotation.y = t * 0.15;
    linesRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#38bdf8"
        transparent
        opacity={0.32}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

export default function VolumetricNeuralCloudCanvas({ scrollProgress = { current: 0 } }) {
  const mouse3D = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      mouse3D.current = {
        x: (e.clientX / innerWidth) * 2 - 1,
        y: -(e.clientY / innerHeight) * 2 + 1,
      };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 42 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="w-full h-full"
      >
        <color attach="background" args={["#04070a"]} />

        <ambientLight intensity={0.4} />

        {/* 22,000+ Volumetric Points & Electrical Synapse Lines */}
        <VolumetricNeuralParticles mouse3D={mouse3D} scrollProgress={scrollProgress} />
        <SynapticDischargeRays count={48} />
      </Canvas>
    </div>
  );
}
