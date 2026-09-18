import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

const LIME_GLOW = new THREE.Color("#bef264");
const CYAN_GLOW = new THREE.Color("#38bdf8");
const PURPLE_GLOW = new THREE.Color("#a78bfa");
const DEEP_CORE = new THREE.Color("#05100a");

/**
 * Procedural dual-hemisphere brain geometry
 */
function buildBrainGeometry() {
  const geo = new THREE.SphereGeometry(1.38, 128, 96);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Deep sagittal fissure (hemispheric split along X=0)
    const fissureDepth = Math.exp(-v.x * v.x * 14) * 0.24;

    // Multi-frequency harmonic gyri and sulci surface folds
    const fold1 = Math.sin(v.x * 6.5 + v.y * 8.2) * Math.cos(v.z * 5.4) * 0.072;
    const fold2 = Math.sin(v.x * 13.0 + v.z * 11.0) * Math.cos(v.y * 9.5 + 1.2) * 0.042;
    const fold3 = Math.sin(v.y * 18.0 + v.x * 15.0 + v.z * 9.0) * 0.022;

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
 * Deep Synapse Tunnel Particles (stretching z = -6 to z = 28)
 */
function generateTunnelParticles(count = 1600) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 1.5 + Math.random() * 4.8;
    const theta = Math.random() * Math.PI * 2;
    const z = -6 + Math.random() * 32;

    positions[i * 3] = radius * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(theta);
    positions[i * 3 + 2] = z;
  }
  return positions;
}

/**
 * Neural Axon Tunnel Cables snaking down Z axis
 */
function generateAxonCables(count = 10) {
  const cables = [];
  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * Math.PI * 2;
    const radius = 2.2 + Math.sin(i) * 0.9;
    const points = [];

    for (let z = 28; z >= -6; z -= 2) {
      const wobble = Math.sin(z * 0.35 + i) * 0.65;
      points.push(
        new THREE.Vector3(
          (radius + wobble) * Math.cos(baseAngle + z * 0.07),
          (radius + wobble) * Math.sin(baseAngle + z * 0.07),
          z
        )
      );
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 54, 0.014, 6, false);
    cables.push({
      geo,
      color: i % 3 === 0 ? LIME_GLOW : i % 3 === 1 ? CYAN_GLOW : PURPLE_GLOW,
    });
  }
  return cables;
}

/**
 * Cortical Domain Nodes on the brain
 */
const DOMAIN_NODES = [
  { id: "pfc_l", pos: [-0.68, 0.48, 1.05], label: "Executive PFC (Left)", color: "#bef264", role: "Sustained Attention & SART Commission Gating" },
  { id: "pfc_r", pos: [0.68, 0.48, 1.05], label: "Executive Control (Right)", color: "#bef264", role: "Inhibitory Focus & Cognitive Flexibility" },
  { id: "memory_l", pos: [-0.88, -0.15, 0.22], label: "Hippocampal Buffer", color: "#38bdf8", role: "Wechsler Working Memory Recall limit" },
  { id: "memory_r", pos: [0.88, -0.15, 0.22], label: "Consolidation Index", color: "#38bdf8", role: "Long-term Synaptic Potentiation" },
  { id: "parietal", pos: [0.0, 0.78, -0.42], label: "Parietal Visual-Spatial", color: "#a78bfa", role: "Corsi Block Visuospatial Span" },
  { id: "occipital", pos: [0.0, 0.12, -1.35], label: "Occipital Alertness", color: "#f472b6", role: "Early Sensory Stimulus Encoding" },
  { id: "insula", pos: [0.0, -0.38, 0.62], label: "Autonomic Stress Buffering", color: "#34d399", role: "Vagal HRV & Sympathetic Regulation" },
  { id: "motor", pos: [0.58, 0.68, 0.22], label: "Psychomotor Latency", color: "#fb923c", role: "PVT-B Sub-second Motor Reaction Speed" },
];

function GyroRing({ radius, axis = "y", speed = 0.2, color = "#bef264" }) {
  const ref = useRef(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (axis === "x") ref.current.rotation.x += delta * speed;
    if (axis === "y") ref.current.rotation.y += delta * speed;
    if (axis === "z") ref.current.rotation.z += delta * speed;
  });
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.008, 14, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function TunnelScene({ scrollProgress = 0, onSelectNode, activeNodeId }) {
  const brainRef = useRef(null);
  const tunnelParticlesRef = useRef(null);

  const brainGeometry = useMemo(() => buildBrainGeometry(), []);
  const tunnelParticles = useMemo(() => generateTunnelParticles(1600), []);
  const axonCables = useMemo(() => generateAxonCables(10), []);

  useFrame((state, delta) => {
    const p = THREE.MathUtils.clamp(scrollProgress, 0, 1);

    // Camera Trajectory:
    // p = 0.0 (Deep Tunnel): z = 18.0
    // p = 0.35 (Prefrontal Zoom): z = 3.6, x = -0.65
    // p = 0.70 (Dorsal Overhead): z = 2.8, y = 2.5
    // p = 1.00 (Coronal Symmetry): z = 4.3, y = 0
    let targetCamX = 0;
    let targetCamY = 0;
    let targetCamZ = 18;
    let lookTargetY = 0;

    let targetBrainRotY = state.clock.getElapsedTime() * 0.2;
    let targetBrainRotX = 0;

    if (p < 0.35) {
      const t = p / 0.35;
      targetCamZ = THREE.MathUtils.lerp(18, 3.8, t);
      targetCamX = THREE.MathUtils.lerp(0, -0.65, t);
      targetCamY = THREE.MathUtils.lerp(0, 0.35, t);
      targetBrainRotX = THREE.MathUtils.lerp(0, -0.35, t);
      targetBrainRotY += THREE.MathUtils.lerp(0, 0.85, t);
    } else if (p < 0.7) {
      const t = (p - 0.35) / 0.35;
      targetCamZ = THREE.MathUtils.lerp(3.8, 2.8, t);
      targetCamX = THREE.MathUtils.lerp(-0.65, 0.0, t);
      targetCamY = THREE.MathUtils.lerp(0.35, 2.5, t);
      lookTargetY = THREE.MathUtils.lerp(0, -0.35, t);
      targetBrainRotX = THREE.MathUtils.lerp(-0.35, -1.25, t);
      targetBrainRotY += THREE.MathUtils.lerp(0.85, 2.5, t);
    } else {
      const t = (p - 0.7) / 0.3;
      targetCamZ = THREE.MathUtils.lerp(2.8, 4.4, t);
      targetCamX = 0;
      targetCamY = THREE.MathUtils.lerp(2.5, 0.0, t);
      targetBrainRotX = THREE.MathUtils.lerp(-1.25, 0.05, t);
      targetBrainRotY += THREE.MathUtils.lerp(2.5, 3.9, t);
    }

    // Pointer parallax
    targetCamX += state.pointer.x * 0.35;
    targetCamY += state.pointer.y * 0.35;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, 0.05);

    state.camera.lookAt(0, lookTargetY, 0);

    if (brainRef.current) {
      brainRef.current.rotation.x = THREE.MathUtils.lerp(brainRef.current.rotation.x, targetBrainRotX, 0.05);
      brainRef.current.rotation.y = THREE.MathUtils.lerp(brainRef.current.rotation.y, targetBrainRotY, 0.05);
    }

    if (tunnelParticlesRef.current) {
      tunnelParticlesRef.current.rotation.z += delta * 0.04;
    }
  });

  return (
    <>
      {/* ── Volumetric Depth Fog ── */}
      <fogExp2 attach="fog" args={["#040806", 0.042]} />

      {/* ── 1. Deep Synapse Tunnel Particles ── */}
      <group ref={tunnelParticlesRef}>
        <Points positions={tunnelParticles} stride={3}>
          <PointMaterial
            transparent
            color={LIME_GLOW}
            size={0.038}
            sizeAttenuation={true}
            depthWrite={false}
            opacity={0.65}
          />
        </Points>
      </group>

      {/* ── 2. Axon Nerve Cables ── */}
      {axonCables.map((cable, idx) => (
        <mesh key={idx} geometry={cable.geo}>
          <meshBasicMaterial color={cable.color} transparent opacity={0.38} />
        </mesh>
      ))}

      {/* ── 3. Central Procedural Neural Cortex at Z=0 ── */}
      <group ref={brainRef} position={[0, 0, 0]}>
        {/* Glowing Inner Core */}
        <mesh geometry={brainGeometry}>
          <meshStandardMaterial
            color={DEEP_CORE}
            roughness={0.2}
            metalness={0.92}
            emissive={scrollProgress > 0.65 ? PURPLE_GLOW : LIME_GLOW}
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Outer Synaptic Wireframe */}
        <mesh geometry={brainGeometry} scale={1.015}>
          <meshStandardMaterial
            color={scrollProgress > 0.65 ? CYAN_GLOW : LIME_GLOW}
            wireframe
            transparent
            opacity={0.35}
            emissive={LIME_GLOW}
            emissiveIntensity={0.32}
          />
        </mesh>

        {/* Gyroscopic Telemetry Rings */}
        <GyroRing radius={2.2} axis="y" speed={0.22} color="#bef264" />
        <GyroRing radius={2.4} axis="x" speed={-0.16} color="#38bdf8" />
        <GyroRing radius={2.6} axis="z" speed={0.14} color="#a78bfa" />

        {/* 8 Clickable Cortical Domain Nodes */}
        {DOMAIN_NODES.map((node) => {
          const isSelected = activeNodeId === node.id;
          return (
            <group
              key={node.id}
              position={node.pos}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectNode) onSelectNode(node);
              }}
            >
              {/* Interactive Sphere */}
              <mesh>
                <sphereGeometry args={[isSelected ? 0.085 : 0.052, 16, 16]} />
                <meshBasicMaterial color={node.color} />
              </mesh>
              {/* Radiating Ring */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.075, 0.098, 24]} />
                <meshBasicMaterial color={node.color} transparent opacity={0.7} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })}
      </group>
    </>
  );
}

export default function FullscreenTunnelBrainCanvas({
  scrollProgress = 0,
  onSelectNode,
  activeNodeId,
}) {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      <div
        className="absolute inset-0 transition-all duration-1000 opacity-45"
        style={{
          background:
            scrollProgress > 0.65
              ? "radial-gradient(circle at 50% 50%, rgba(167,139,250,0.2) 0%, rgba(56,189,248,0.12) 45%, transparent 75%)"
              : "radial-gradient(circle at 50% 50%, rgba(190,242,100,0.22) 0%, rgba(56,189,248,0.12) 40%, transparent 75%)",
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 18], fov: 46 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="w-full h-full pointer-events-auto"
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 7, 9]} intensity={2.4} color="#ffffff" />
        <pointLight position={[-4, -3, -1]} intensity={3.2} color="#bef264" />
        <pointLight position={[3, -2, 5]} intensity={2.4} color="#38bdf8" />
        <pointLight position={[0, 5, -2]} intensity={2.2} color="#a78bfa" />
        <TunnelScene
          scrollProgress={scrollProgress}
          onSelectNode={onSelectNode}
          activeNodeId={activeNodeId}
        />
      </Canvas>
    </div>
  );
}
