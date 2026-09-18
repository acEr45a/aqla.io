import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Bioluminescent & Obsidian Color Palette
const LIME_GLOW = new THREE.Color("#bef264");
const CYAN_GLOW = new THREE.Color("#38bdf8");
const PURPLE_GLOW = new THREE.Color("#a78bfa");
const EMERALD_GLOW = new THREE.Color("#10b981");
const OBSIDIAN_CORE = new THREE.Color("#08140e");

export const WAYPOINT_CAMERA_DEPTHS = [22.0, 14.0, 7.5, 4.3, 3.6];

/**
 * Procedural dual-hemisphere brain geometry with sulci & gyri convolutions
 */
function buildBrainGeometry() {
  const geo = new THREE.SphereGeometry(1.38, 128, 96);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Deep sagittal fissure (hemispheric split along X=0)
    const fissureDepth = Math.exp(-v.x * v.x * 14) * 0.25;

    // Multi-frequency harmonic gyri and sulci surface folds
    const fold1 = Math.sin(v.x * 6.5 + v.y * 8.2) * Math.cos(v.z * 5.4) * 0.075;
    const fold2 = Math.sin(v.x * 13.0 + v.z * 11.0) * Math.cos(v.y * 9.5 + 1.2) * 0.042;
    const fold3 = Math.sin(v.y * 18.0 + v.x * 15.0 + v.z * 9.0) * 0.022;

    const lateralScale = 1.2;
    const verticalScale = 0.88;
    const sagittalScale = 1.1;

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
 * Deep Synapse Tunnel Particles stretching down Z axis (Z = -6 to Z = 28)
 */
function generateTunnelParticles(count = 1800) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 1.4 + Math.random() * 4.6;
    const theta = Math.random() * Math.PI * 2;
    const z = -6 + Math.random() * 34;

    positions[i * 3] = radius * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(theta);
    positions[i * 3 + 2] = z;
  }
  return positions;
}

/**
 * Neural Axon Tunnel Cables snaking down Z axis
 */
function generateAxonCables(count = 12) {
  const cables = [];
  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * Math.PI * 2;
    const radius = 2.1 + Math.sin(i * 1.5) * 0.8;
    const points = [];

    for (let z = 28; z >= -6; z -= 2) {
      const wobble = Math.sin(z * 0.32 + i * 0.8) * 0.6;
      points.push(
        new THREE.Vector3(
          (radius + wobble) * Math.cos(baseAngle + z * 0.06),
          (radius + wobble) * Math.sin(baseAngle + z * 0.06),
          z
        )
      );
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 60, 0.018, 6, false);
    cables.push({
      geo,
      color: i % 3 === 0 ? LIME_GLOW : i % 3 === 1 ? CYAN_GLOW : PURPLE_GLOW,
    });
  }
  return cables;
}

/**
 * Synaptic Arcs firing across lobes on the brain cortex
 */
function generateSynapticArcs(count = 14) {
  const arcs = [];
  const r = 1.39;

  for (let k = 0; k < count; k++) {
    const theta1 = (k / count) * Math.PI * 2 + Math.random() * 0.35;
    const phi1 = Math.acos(2 * Math.random() - 1);
    const start = new THREE.Vector3(
      r * Math.sin(phi1) * Math.cos(theta1) * 1.2,
      r * Math.sin(phi1) * Math.sin(theta1) * 0.88,
      r * Math.cos(phi1) * 1.1
    );

    const theta2 = theta1 + (Math.random() > 0.5 ? 1.4 : -1.4);
    const phi2 = Math.acos(2 * Math.random() - 1);
    const end = new THREE.Vector3(
      r * Math.sin(phi2) * Math.cos(theta2) * 1.2,
      r * Math.sin(phi2) * Math.sin(theta2) * 0.88,
      r * Math.cos(phi2) * 1.1
    );

    const mid = start.clone().lerp(end, 0.5);
    mid.normalize().multiplyScalar(r * (1.3 + Math.random() * 0.3));

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = curve.getPoints(24);
    const positions = [];
    for (let p = 0; p < pts.length - 1; p++) {
      positions.push(pts[p].x, pts[p].y, pts[p].z);
      positions.push(pts[p + 1].x, pts[p + 1].y, pts[p + 1].z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    arcs.push({
      geo,
      color: k % 3 === 0 ? LIME_GLOW : k % 3 === 1 ? CYAN_GLOW : EMERALD_GLOW,
    });
  }
  return arcs;
}

/**
 * 8 Cortical Domain Nodes
 */
const DOMAIN_NODES = [
  { id: "pfc_l", pos: [-0.68, 0.48, 1.05], label: "Executive PFC (Left)", color: "#bef264" },
  { id: "pfc_r", pos: [0.68, 0.48, 1.05], label: "Executive Control (Right)", color: "#bef264" },
  { id: "memory_l", pos: [-0.88, -0.15, 0.22], label: "Hippocampal Buffer", color: "#38bdf8" },
  { id: "memory_r", pos: [0.88, -0.15, 0.22], label: "Consolidation Index", color: "#38bdf8" },
  { id: "parietal", pos: [0.0, 0.78, -0.42], label: "Parietal Attention", color: "#a78bfa" },
  { id: "occipital", pos: [0.0, 0.12, -1.35], label: "Occipital Alertness", color: "#f472b6" },
  { id: "insula", pos: [0.0, -0.38, 0.62], label: "Autonomic Insula", color: "#34d399" },
  { id: "motor", pos: [0.58, 0.68, 0.22], label: "Psychomotor Latency", color: "#bef264" },
];

function GyroRing({ radius = 2.4, axis = "x", speed = 0.3, color = "#bef264", opacity = 0.22 }) {
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
        <torusGeometry args={[radius, 0.007, 16, 96]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

/**
 * Main 3D Tunnel Scene with dynamic camera flight
 */
function TunnelScene({ scrollProgress = { current: 0 }, mouseX, mouseY }) {
  const cameraGroupRef = useRef(null);
  const brainMeshRef = useRef(null);
  const coreRef = useRef(null);
  const tunnelParticlesRef = useRef(null);

  const brainGeometry = useMemo(() => buildBrainGeometry(), []);
  const tunnelParticles = useMemo(() => generateTunnelParticles(1800), []);
  const axonCables = useMemo(() => generateAxonCables(12), []);
  const synapticArcs = useMemo(() => generateSynapticArcs(14), []);

  // 1. Frosted Obsidian Glass Material
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#07100b"),
      roughness: 0.16,
      metalness: 0.12,
      transmission: 0.88,
      ior: 1.52,
      thickness: 1.8,
      specularIntensity: 1.2,
      specularColor: new THREE.Color("#dcfce7"),
      clearcoat: 0.95,
      clearcoatRoughness: 0.08,
      attenuationColor: new THREE.Color("#082b1c"),
      attenuationDistance: 1.1,
      transparent: true,
      opacity: 0.96,
    });
  }, []);

  // 2. Inner Thalamic Bioluminescent Core
  const innerCoreMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: OBSIDIAN_CORE,
      roughness: 0.22,
      metalness: 0.85,
      emissive: LIME_GLOW,
      emissiveIntensity: 0.22,
    });
  }, []);

  // 3. Synaptic Filament Wireframe
  const filamentMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: LIME_GLOW,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const p = THREE.MathUtils.clamp(
      typeof scrollProgress === "number" ? scrollProgress : scrollProgress.current || 0,
      0,
      1
    );

    // ── Continuous Z-Axis Camera Flight Choreography ──
    // p = 0.00: Deep in Axon Tunnel (Z = 22.0)
    // p = 0.25: Flying along Axon Cables (Z = 14.0)
    // p = 0.50: Emerging from Tunnel approaching Cortex (Z = 7.5)
    // p = 0.75: Orbiting Cortical Domain Nodes (Z = 4.3)
    // p = 1.00: Zoomed into Core for In-Situ Psychometrics (Z = 3.6)

    let targetZ, targetX, targetY, targetRotX, targetRotY, targetRotZ;

    if (p < 0.25) {
      const alpha = p / 0.25;
      targetZ = THREE.MathUtils.lerp(22.0, 14.0, alpha);
      targetX = THREE.MathUtils.lerp(0, 0.4, alpha);
      targetY = THREE.MathUtils.lerp(0, 0.2, alpha);
      targetRotX = THREE.MathUtils.lerp(0, 0.08, alpha);
      targetRotY = THREE.MathUtils.lerp(0, 0.15, alpha);
      targetRotZ = THREE.MathUtils.lerp(0, 0.05, alpha);
    } else if (p < 0.5) {
      const alpha = (p - 0.25) / 0.25;
      targetZ = THREE.MathUtils.lerp(14.0, 7.5, alpha);
      targetX = THREE.MathUtils.lerp(0.4, 0.7, alpha);
      targetY = THREE.MathUtils.lerp(0.2, 0.1, alpha);
      targetRotX = THREE.MathUtils.lerp(0.08, -0.15, alpha);
      targetRotY = THREE.MathUtils.lerp(0.15, 0.45, alpha);
      targetRotZ = THREE.MathUtils.lerp(0.05, -0.05, alpha);
    } else if (p < 0.75) {
      const alpha = (p - 0.5) / 0.25;
      targetZ = THREE.MathUtils.lerp(7.5, 4.3, alpha);
      targetX = THREE.MathUtils.lerp(0.7, 0.85, alpha);
      targetY = THREE.MathUtils.lerp(0.1, -0.05, alpha);
      targetRotX = THREE.MathUtils.lerp(-0.15, -0.28, alpha);
      targetRotY = THREE.MathUtils.lerp(0.45, 1.25, alpha);
      targetRotZ = THREE.MathUtils.lerp(-0.05, 0.02, alpha);
    } else {
      const alpha = (p - 0.75) / 0.25;
      targetZ = THREE.MathUtils.lerp(4.3, 3.6, alpha);
      targetX = THREE.MathUtils.lerp(0.85, 0.1, alpha);
      targetY = THREE.MathUtils.lerp(-0.05, 0.0, alpha);
      targetRotX = THREE.MathUtils.lerp(-0.28, 0.05, alpha);
      targetRotY = THREE.MathUtils.lerp(1.25, 2.2, alpha);
      targetRotZ = THREE.MathUtils.lerp(0.02, 0.0, alpha);
    }

    // Add pointer parallax smoothly
    const pointerX = mouseX ? mouseX.current : 0;
    const pointerY = mouseY ? mouseY.current : 0;

    targetX += pointerX * 0.35;
    targetY += pointerY * 0.25;
    targetRotY += pointerX * 0.2;
    targetRotX += -pointerY * 0.2;

    // Dampen camera group position and rotation
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.08);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.08);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.08);

    state.camera.rotation.x = THREE.MathUtils.lerp(state.camera.rotation.x, targetRotX, 0.08);
    state.camera.rotation.y = THREE.MathUtils.lerp(state.camera.rotation.y, targetRotY, 0.08);
    state.camera.rotation.z = THREE.MathUtils.lerp(state.camera.rotation.z, targetRotZ, 0.08);

    // Continuous ambient rotation for tunnel particles and brain
    if (tunnelParticlesRef.current) {
      tunnelParticlesRef.current.rotation.z += delta * 0.05;
    }

    if (brainMeshRef.current) {
      brainMeshRef.current.rotation.y = t * 0.1 + (p * 1.5);
    }

    // Breathing pulse on core
    const breath = 1 + Math.sin(t * 1.5) * 0.015;
    if (coreRef.current) {
      coreRef.current.scale.set(0.97 * breath, 0.97 * breath, 0.97 * breath);
    }
  });

  return (
    <>
      {/* ── 1. Deep Synapse Tunnel Particles ── */}
      <group ref={tunnelParticlesRef}>
        <Points positions={tunnelParticles} stride={3}>
          <PointMaterial
            transparent
            color="#38bdf8"
            size={0.038}
            sizeAttenuation={true}
            depthWrite={false}
            opacity={0.65}
          />
        </Points>
      </group>

      {/* ── 2. Neural Axon Tunnel Cables ── */}
      {axonCables.map((cable, idx) => (
        <mesh key={idx} geometry={cable.geo}>
          <meshStandardMaterial
            color={cable.color}
            emissive={cable.color}
            emissiveIntensity={0.45}
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
          />
        </mesh>
      ))}

      {/* ── 3. Frosted Obsidian Glass Cortex (Located at Z = 0) ── */}
      <group ref={brainMeshRef} position={[0, 0, 0]}>
        {/* Inner Bioluminescent Core */}
        <mesh ref={coreRef} geometry={brainGeometry} material={innerCoreMaterial} scale={0.97} />

        {/* Outer Frosted Obsidian Glass Body */}
        <mesh geometry={brainGeometry} material={glassMaterial} castShadow receiveShadow />

        {/* Neural Wireframe Filament */}
        <mesh geometry={brainGeometry} material={filamentMaterial} scale={1.012} />

        {/* Firing Synaptic Arcs */}
        {synapticArcs.map((arc, idx) => (
          <lineSegments key={idx} geometry={arc.geo}>
            <lineBasicMaterial color={arc.color} transparent opacity={0.7} linewidth={1.5} />
          </lineSegments>
        ))}

        {/* 8 Cortical Domain Nodes */}
        {DOMAIN_NODES.map((node) => (
          <group key={node.id} position={node.pos}>
            <mesh>
              <sphereGeometry args={[0.048, 16, 16]} />
              <meshBasicMaterial color={node.color} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.065, 0.09, 20]} />
              <meshBasicMaterial color={node.color} transparent opacity={0.55} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}

        {/* Gyroscopic Telemetry Rings */}
        <GyroRing radius={2.2} axis="y" speed={0.25} color="#bef264" opacity={0.25} />
        <GyroRing radius={2.4} axis="x" speed={-0.18} color="#38bdf8" opacity={0.2} />
      </group>
    </>
  );
}

export default function FullscreenTunnelBrainCanvas({
  scrollProgress = { current: 0 },
  className = "",
}) {
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.current = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY.current = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className={`fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 22.0], fov: 45, near: 0.1, far: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="w-full h-full"
      >
        <color attach="background" args={["#04070a"]} />

        {/* Studio Tunnel Lighting */}
        <ambientLight intensity={0.6} />

        {/* Directional Lights positioned along tunnel */}
        <directionalLight position={[0, 10, 15]} intensity={2.5} color="#f4fbf7" />
        <directionalLight position={[-6, 4, 0]} intensity={3.5} color="#bef264" />
        <directionalLight position={[6, -4, 0]} intensity={2.5} color="#38bdf8" />
        <pointLight position={[0, 0, 0]} intensity={3.0} color="#bef264" distance={8} />

        <TunnelScene scrollProgress={scrollProgress} mouseX={mouseX} mouseY={mouseY} />
      </Canvas>
    </div>
  );
}
