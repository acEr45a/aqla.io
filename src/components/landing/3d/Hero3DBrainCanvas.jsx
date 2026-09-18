import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Dynamic Palette
const LIME_GLOW = new THREE.Color("#bef264");
const CYAN_GLOW = new THREE.Color("#38bdf8");
const PURPLE_GLOW = new THREE.Color("#a78bfa");
const AMBER_GLOW = new THREE.Color("#f59e0b");
const DEEP_CORE = new THREE.Color("#07120c");

/**
 * Procedural dual-hemisphere brain geometry with sulci/gyri folds
 */
function buildBrainGeometry() {
  const geo = new THREE.SphereGeometry(1.35, 120, 96);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Deep sagittal fissure (hemispheric split along X=0)
    const fissureDepth = Math.exp(-v.x * v.x * 14) * 0.22;

    // Multi-frequency harmonic gyri and sulci surface folds
    const fold1 = Math.sin(v.x * 6.5 + v.y * 8.2) * Math.cos(v.z * 5.4) * 0.068;
    const fold2 = Math.sin(v.x * 13.0 + v.z * 11.0) * Math.cos(v.y * 9.5 + 1.2) * 0.038;
    const fold3 = Math.sin(v.y * 18.0 + v.x * 15.0 + v.z * 9.0) * 0.019;

    // Brain anatomical proportions
    const lateralScale = 1.18;
    const verticalScale = 0.86;
    const sagittalScale = 1.08;

    const r = v.length();
    const bottomCerebellarCut = v.y < -0.28 ? (v.y + 0.28) * 0.35 : 0;

    const displacement = -fissureDepth + fold1 + fold2 + fold3 + bottomCerebellarCut;
    const newR = r * (1 + displacement);

    v.normalize().multiplyScalar(newR);
    v.x *= lateralScale;
    v.y *= verticalScale;
    v.z *= sagittalScale;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates synaptic arcs firing across cortical regions
 */
function generateSynapticArcs(count = 12) {
  const arcs = [];
  const r = 1.38;

  for (let k = 0; k < count; k++) {
    const theta1 = (k / count) * Math.PI * 2 + Math.random() * 0.4;
    const phi1 = Math.acos(2 * Math.random() - 1);
    const start = new THREE.Vector3(
      r * Math.sin(phi1) * Math.cos(theta1) * 1.18,
      r * Math.sin(phi1) * Math.sin(theta1) * 0.86,
      r * Math.cos(phi1) * 1.08
    );

    const theta2 = theta1 + (Math.random() > 0.5 ? 1.5 : -1.5);
    const phi2 = Math.acos(2 * Math.random() - 1);
    const end = new THREE.Vector3(
      r * Math.sin(phi2) * Math.cos(theta2) * 1.18,
      r * Math.sin(phi2) * Math.sin(theta2) * 0.86,
      r * Math.cos(phi2) * 1.08
    );

    const mid = start.clone().lerp(end, 0.5);
    mid.normalize().multiplyScalar(r * (1.35 + Math.random() * 0.35));

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = curve.getPoints(26);
    const positions = [];
    for (let p = 0; p < pts.length - 1; p++) {
      positions.push(pts[p].x, pts[p].y, pts[p].z);
      positions.push(pts[p + 1].x, pts[p + 1].y, pts[p + 1].z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    arcs.push({ geo, color: k % 3 === 0 ? LIME_GLOW : k % 3 === 1 ? CYAN_GLOW : PURPLE_GLOW });
  }
  return arcs;
}

/**
 * 8 Cortical Node Markers positioned around real neural regions
 */
const CORTICAL_NODES = [
  { id: "pfc_left", pos: [-0.65, 0.45, 1.0], label: "Executive PFC (Left)", color: "#bef264" },
  { id: "pfc_right", pos: [0.65, 0.45, 1.0], label: "Executive PFC (Right)", color: "#bef264" },
  { id: "hippocampus_l", pos: [-0.85, -0.15, 0.2], label: "Hippocampus Memory", color: "#f472b6" },
  { id: "hippocampus_r", pos: [0.85, -0.15, 0.2], label: "Hippocampus Buffer", color: "#f472b6" },
  { id: "parietal_l", pos: [-0.75, 0.65, -0.5], label: "Parietal Attention", color: "#38bdf8" },
  { id: "parietal_r", pos: [0.75, 0.65, -0.5], label: "Parietal Spatial", color: "#38bdf8" },
  { id: "occipital", pos: [0.0, 0.1, -1.3], label: "Occipital Visual", color: "#a78bfa" },
  { id: "insula", pos: [0.0, -0.35, 0.6], label: "Autonomic Insula", color: "#34d399" },
];

/**
 * Dynamic particle cloud
 */
function generateParticles(count = 550) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 1.9 + Math.random() * 2.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.85;
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  return positions;
}

/**
 * Gyroscopic Holographic Ring
 */
function GyroRing({ radius = 2.4, axis = "x", speed = 0.4, color = "#bef264", opacity = 0.25 }) {
  const ringRef = useRef(null);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    if (axis === "x") ringRef.current.rotation.x += delta * speed;
    if (axis === "y") ringRef.current.rotation.y += delta * speed;
    if (axis === "z") ringRef.current.rotation.z += delta * speed;
  });

  return (
    <group ref={ringRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.008, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function BrainMeshInternal({ scrollProgress = 0, activeNodeId = null }) {
  const groupRef = useRef(null);
  const coreRef = useRef(null);
  const wireRef = useRef(null);

  const brainGeometry = useMemo(() => buildBrainGeometry(), []);
  const synapticArcs = useMemo(() => generateSynapticArcs(14), []);
  const particlePositions = useMemo(() => generateParticles(580), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth scroll interpolation (0 to 1)
    const p = THREE.MathUtils.clamp(scrollProgress, 0, 1);

    // ── Phase 1 (p: 0 -> 0.3): Frontal Hero -> Prefrontal Latency Zoom ──
    // ── Phase 2 (p: 0.3 -> 0.65): Prefrontal Zoom -> Top-down 8 Domains ──
    // ── Phase 3 (p: 0.65 -> 1.0): Top-down -> Circadian Dual-Tone Symmetry ──
    let targetRotX = 0;
    let targetRotY = state.clock.getElapsedTime() * 0.15;
    let targetRotZ = 0;
    let targetPosZ = 0;
    let targetScale = 1.0;

    if (p < 0.35) {
      // Zooming into frontal executive cortex
      const t = p / 0.35;
      targetRotX = THREE.MathUtils.lerp(0.1, -0.45, t);
      targetRotY += THREE.MathUtils.lerp(0, 0.9, t);
      targetPosZ = THREE.MathUtils.lerp(0, 0.8, t); // Zoom closer
      targetScale = THREE.MathUtils.lerp(1.0, 1.25, t);
    } else if (p < 0.7) {
      // Transitioning to dorsal top-down view for 8-domain holographic matrix
      const t = (p - 0.35) / 0.35;
      targetRotX = THREE.MathUtils.lerp(-0.45, -1.25, t);
      targetRotY += THREE.MathUtils.lerp(0.9, 2.5, t);
      targetPosZ = THREE.MathUtils.lerp(0.8, -0.2, t);
      targetScale = THREE.MathUtils.lerp(1.25, 1.1, t);
    } else {
      // Transitioning to aligned coronal symmetry for circadian protocols
      const t = (p - 0.7) / 0.3;
      targetRotX = THREE.MathUtils.lerp(-1.25, 0.05, t);
      targetRotY += THREE.MathUtils.lerp(2.5, 4.2, t);
      targetPosZ = THREE.MathUtils.lerp(-0.2, 0.1, t);
      targetScale = THREE.MathUtils.lerp(1.1, 1.05, t);
    }

    // Add pointer parallax on top of scroll choreography
    targetRotX += state.pointer.y * 0.35;
    targetRotZ += -state.pointer.x * 0.35;

    // Dampen smoothly with lerp
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.06);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.06);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.06);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetPosZ, 0.06);
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.06));

    // Gentle breathing pulse
    const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 2.2) * 0.018;
    if (coreRef.current) {
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Dark glowing inner core */}
      <mesh ref={coreRef} geometry={brainGeometry}>
        <meshStandardMaterial
          color={DEEP_CORE}
          roughness={0.2}
          metalness={0.9}
          emissive={scrollProgress > 0.65 ? PURPLE_GLOW : LIME_GLOW}
          emissiveIntensity={0.16}
        />
      </mesh>

      {/* 2. Outer holographic synaptic wireframe */}
      <mesh ref={wireRef} geometry={brainGeometry} scale={1.015}>
        <meshStandardMaterial
          color={scrollProgress > 0.65 ? CYAN_GLOW : LIME_GLOW}
          wireframe
          transparent
          opacity={0.32}
          roughness={0.1}
          metalness={0.95}
          emissive={LIME_GLOW}
          emissiveIntensity={0.28}
        />
      </mesh>

      {/* 3. Synaptic Arc Lines */}
      {synapticArcs.map((arc, idx) => (
        <lineSegments key={idx} geometry={arc.geo}>
          <lineBasicMaterial
            color={arc.color}
            transparent
            opacity={0.7}
            linewidth={1.5}
          />
        </lineSegments>
      ))}

      {/* 4. Cortical Domain Nodes */}
      {CORTICAL_NODES.map((node) => {
        const isTarget = activeNodeId === node.id;
        return (
          <group key={node.id} position={node.pos}>
            {/* Glowing sphere marker */}
            <mesh>
              <sphereGeometry args={[isTarget ? 0.07 : 0.045, 16, 16]} />
              <meshBasicMaterial color={node.color} />
            </mesh>
            {/* Pulsing ring halo */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.06, 0.08, 24]} />
              <meshBasicMaterial color={node.color} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}

      {/* 5. Gyroscopic Telemetry Rings */}
      <GyroRing radius={2.1} axis="y" speed={0.25} color="#bef264" opacity={0.2} />
      <GyroRing radius={2.3} axis="x" speed={-0.18} color="#38bdf8" opacity={0.18} />
      <GyroRing radius={2.5} axis="z" speed={0.12} color="#a78bfa" opacity={0.14} />

      {/* 6. Ambient Particle Aura */}
      <Points positions={particlePositions} stride={3}>
        <PointMaterial
          transparent
          color={scrollProgress > 0.65 ? CYAN_GLOW : LIME_GLOW}
          size={0.026}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.65}
        />
      </Points>
    </group>
  );
}

export default function Hero3DBrainCanvas({ scrollProgress = 0, activeNodeId = null, className = "" }) {
  return (
    <div className={`relative w-full h-full select-none pointer-events-auto ${className}`}>
      {/* Radial back-glow matching scroll progression */}
      <div
        className="absolute inset-0 pointer-events-none rounded-full blur-3xl opacity-40 transition-colors duration-1000"
        style={{
          background:
            scrollProgress > 0.65
              ? "radial-gradient(circle at 50% 50%, rgba(167,139,250,0.22) 0%, rgba(56,189,248,0.15) 50%, transparent 75%)"
              : "radial-gradient(circle at 50% 50%, rgba(190,242,100,0.24) 0%, rgba(56,189,248,0.14) 45%, transparent 75%)",
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 4.3], fov: 42 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 5, 3]} intensity={2.0} color="#ffffff" />
        <pointLight position={[-4, -3, -2]} intensity={2.8} color="#bef264" />
        <pointLight position={[3, -2, 4]} intensity={2.0} color="#38bdf8" />
        <pointLight position={[0, 4, -3]} intensity={1.8} color="#a78bfa" />
        <BrainMeshInternal scrollProgress={scrollProgress} activeNodeId={activeNodeId} />
      </Canvas>
    </div>
  );
}
