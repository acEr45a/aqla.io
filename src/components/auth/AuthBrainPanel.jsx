import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import AqlaLogo from "@/components/AqlaLogo";

/* ═══════════════════════════════════════════
   Constants & Palette
   ═══════════════════════════════════════════ */
const LIME      = new THREE.Color().setHSL(75 / 360, 0.82, 0.55);
const LIME_DARK = new THREE.Color().setHSL(75 / 360, 0.6, 0.25);
const CYAN      = new THREE.Color().setHSL(185 / 360, 0.85, 0.5);
const DEEP      = new THREE.Color().setHSL(26 / 360, 0.14, 0.04);

/* ═══════════════════════════════════════════
   Brain geometry — stylised dual-hemisphere
   with sulci/gyri folds via procedural noise
   ═══════════════════════════════════════════ */

/* Simple 3D noise for surface folds */
function noise3D(x, y, z) {
  const p = x * 12.9898 + y * 78.233 + z * 37.719;
  return (Math.sin(p) * 43758.5453) % 1;
}

function buildBrainGeometry() {
  const geo = new THREE.SphereGeometry(1.3, 128, 96);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // ── Hemisphere separation: pinch along the sagittal fissure (x≈0) ──
    const fissureDepth = Math.exp(-v.x * v.x * 12) * 0.18;

    // ── Gyri folds: multi-frequency displacement ──
    const fold1 = Math.sin(v.x * 6 + v.y * 8) * Math.cos(v.z * 5) * 0.06;
    const fold2 = Math.sin(v.x * 12 + v.z * 10) * Math.cos(v.y * 9 + 1.5) * 0.035;
    const fold3 = Math.sin(v.y * 16 + v.x * 14 + v.z * 8) * 0.018;

    // ── Overall brain shape: wider than tall, slightly elongated front-back ──
    const lateral = 1.15; // wider left-right
    const vertical = 0.88; // flatter top-bottom
    const sagittal = 1.05; // slightly longer front-back

    const r = v.length();
    const theta = Math.atan2(v.z, v.x);
    const phi = Math.acos(THREE.MathUtils.clamp(v.y / (r || 1), -1, 1));

    // Flatten bottom (cerebellum area)
    const bottomFlat = v.y < -0.3 ? (v.y + 0.3) * 0.3 : 0;

    const displacement = -fissureDepth + fold1 + fold2 + fold3 + bottomFlat;
    const newR = r * (1 + displacement);

    v.normalize().multiplyScalar(newR);
    v.x *= lateral;
    v.y *= vertical;
    v.z *= sagittal;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/* ═══════════════════════════════════════════
   Particle cloud — refined, smaller dots
   ═══════════════════════════════════════════ */
function makeParticles(count = 500) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 2.0 + Math.random() * 3.0;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.005 + Math.random() * 0.015;
  }
  return { positions, sizes };
}

/* ═══════════════════════════════════════════
   Neural arcs — glowing synaptic connections
   ═══════════════════════════════════════════ */
function buildArc(brainRadius = 1.3) {
  const r = brainRadius * 1.05;
  const randomSurface = () => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta) * 1.15,
      r * Math.sin(phi) * Math.sin(theta) * 0.88,
      r * Math.cos(phi) * 1.05
    );
  };

  const start = randomSurface();
  const end = randomSurface();
  const mid = start.clone().lerp(end, 0.5);
  // Push mid-point outward for curved arc
  mid.normalize().multiplyScalar(r * 1.6);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(20);

  const positions = [];
  for (let i = 0; i < points.length - 1; i++) {
    positions.push(points[i].x, points[i].y, points[i].z);
    positions.push(points[i + 1].x, points[i + 1].y, points[i + 1].z);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

/* ═══════════════════════════════════════════
   Brain Mesh — dark glass + lime edge emission
   ═══════════════════════════════════════════ */
function BrainMesh({ mouseRef, scrollYRef }) {
  const meshRef = useRef();
  const edgeRef = useRef();
  const glowRef = useRef();
  const geo = useMemo(buildBrainGeometry, []);
  const targetRot = useRef({ x: 0, y: 0 });

  useFrame(({ clock }, dt) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const m = meshRef.current;

    // Breathing
    const scale = 1 + Math.sin(t * 0.6) * 0.02;
    m.scale.setScalar(scale);

    // Mouse parallax — smooth lerp
    targetRot.current.x = mouseRef.current.y * 0.3;
    targetRot.current.y = mouseRef.current.x * 0.35;
    m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, targetRot.current.x, dt * 2);
    m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, targetRot.current.y + t * 0.05, dt * 2);

    // Scroll depth
    const sy = scrollYRef.current;
    m.position.y = THREE.MathUtils.lerp(m.position.y, -sy * 0.002, dt * 3);

    // Sync edge and glow meshes
    [edgeRef, glowRef].forEach(ref => {
      if (ref.current) {
        ref.current.rotation.copy(m.rotation);
        ref.current.scale.copy(m.scale);
        ref.current.position.copy(m.position);
      }
    });

    // Pulse edge glow
    if (edgeRef.current) {
      edgeRef.current.material.opacity = 0.25 + Math.sin(t * 1.8) * 0.1;
    }
  });

  return (
    <group>
      {/* Main brain — dark transparent glass */}
      <mesh ref={meshRef} geometry={geo}>
        <meshPhysicalMaterial
          color={new THREE.Color(0x0a1a0a)}
          roughness={0.15}
          metalness={0.3}
          transmission={0.6}
          thickness={2.0}
          ior={1.5}
          transparent
          opacity={0.55}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe overlay — subtle structure lines */}
      <mesh ref={edgeRef} geometry={geo}>
        <meshBasicMaterial
          color={LIME}
          wireframe
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner volume glow */}
      <mesh ref={glowRef} geometry={geo} scale={0.92}>
        <meshBasicMaterial
          color={LIME}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════
   Neural Arcs — smooth curved synaptic lines
   ═══════════════════════════════════════════ */
function NeuralArcs() {
  const groupRef = useRef();
  const arcsRef = useRef([]);
  const lastUpdate = useRef(0);

  // Pre-generate initial arcs
  useMemo(() => {
    arcsRef.current = Array.from({ length: 8 }, () => buildArc());
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (t - lastUpdate.current > 0.6) {
      lastUpdate.current = t;
      // Rotate 2 arcs at a time for smooth transitions
      arcsRef.current.shift();
      arcsRef.current.shift();
      arcsRef.current.push(buildArc());
      arcsRef.current.push(buildArc());
    }

    // Fade arcs based on age
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child.material) {
          const age = (i / arcsRef.current.length);
          child.material.opacity = 0.3 + age * 0.4;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {arcsRef.current.map((geo, i) => (
        <lineSegments key={i} geometry={geo}>
          <lineBasicMaterial
            color={i % 2 === 0 ? LIME : CYAN}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Orbital Rings — subtle rotating halos
   ═══════════════════════════════════════════ */
function OrbitalRings() {
  const group = useRef();

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.rotation.y = t * 0.03;
    group.current.rotation.x = Math.sin(t * 0.02) * 0.1;
  });

  const rings = useMemo(() => [
    { radius: 2.2, tube: 0.003, rotation: [0.3, 0, 0], opacity: 0.12 },
    { radius: 2.6, tube: 0.002, rotation: [1.2, 0.4, 0], opacity: 0.08 },
    { radius: 3.0, tube: 0.002, rotation: [0.8, 1.0, 0.3], opacity: 0.06 },
  ], []);

  return (
    <group ref={group}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={ring.rotation}>
          <torusGeometry args={[ring.radius, ring.tube, 16, 100]} />
          <meshBasicMaterial
            color={LIME}
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Particle Field — refined floating specks
   ═══════════════════════════════════════════ */
function ParticleField() {
  const ref = useRef();
  const { positions } = useMemo(() => makeParticles(400), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.008;
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.005) * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={LIME}
        size={0.012}
        sizeAttenuation
        depthWrite={false}
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

/* ═══════════════════════════════════════════
   Core Glow — pulsing inner light
   ═══════════════════════════════════════════ */
function CoreGlow() {
  const ref = useRef();
  const ref2 = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.material.opacity = 0.08 + Math.sin(t * 1.2) * 0.04;
      ref.current.scale.setScalar(0.5 + Math.sin(t * 0.7) * 0.05);
    }
    if (ref2.current) {
      ref2.current.material.opacity = 0.04 + Math.sin(t * 0.8 + 1) * 0.02;
      ref2.current.scale.setScalar(0.9 + Math.sin(t * 0.5) * 0.08);
    }
  });

  return (
    <>
      <mesh ref={ref}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color={LIME}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ref2}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

/* ═══════════════════════════════════════════
   Scene Composition
   ═══════════════════════════════════════════ */
function Scene({ mouseRef, scrollYRef }) {
  return (
    <>
      {/* Lighting for glass refraction */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />
      <directionalLight position={[-4, -2, 3]} intensity={0.3} color={CYAN} />
      <pointLight position={[0, 0, 0]} intensity={1.2} color={LIME} distance={4} decay={2} />
      <pointLight position={[2, 1, -2]} intensity={0.4} color={CYAN} distance={6} decay={2} />
      <spotLight
        position={[0, 4, 3]}
        angle={0.5}
        penumbra={0.8}
        intensity={0.8}
        color={LIME}
        distance={10}
        decay={2}
      />

      {/* HDR environment for glass reflections */}
      <Environment preset="night" />

      <BrainMesh mouseRef={mouseRef} scrollYRef={scrollYRef} />
      <NeuralArcs />
      <OrbitalRings />
      <ParticleField />
      <CoreGlow />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          intensity={2.0}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.001, 0.001]}
        />
      </EffectComposer>
    </>
  );
}

/* ═══════════════════════════════════════════
   AuthBrainPanel — the exported component
   ═══════════════════════════════════════════ */
export default function AuthBrainPanel({ scrollYRef }) {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const fallback = useRef(0);
  const activeScroll = scrollYRef ?? fallback;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 40% 50%, hsl(75 20% 6% / 0.6), hsl(26 14% 3%) 70%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0.2, 4.5], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene mouseRef={mouseRef} scrollYRef={activeScroll} />
      </Canvas>

      {/* Gradient overlays for premium depth */}
      {/* Right edge fade */}
      <div
        className="absolute inset-y-0 right-0 w-32 pointer-events-none"
        style={{
          background: "linear-gradient(to right, transparent, hsl(26 14% 6%) 90%)",
        }}
      />

      {/* Top fade */}
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, hsl(26 14% 3% / 0.8), transparent)",
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to top, hsl(26 14% 3% / 0.6), transparent)",
        }}
      />

      {/* Branding */}
      <div className="absolute bottom-8 left-8 z-10 flex flex-col gap-2">
        <AqlaLogo className="text-foreground/60" />
        <p className="text-[10px] text-muted-foreground/40 leading-snug max-w-[160px] tracking-wide uppercase">
          Understand your brain.<br />Improve your life.
        </p>
      </div>

      {/* Corner accent glow */}
      <div
        className="absolute top-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(circle at 0% 0%, hsl(75 60% 40% / 0.06), transparent 60%)",
        }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 40% 50%, transparent 30%, hsl(26 14% 3% / 0.7) 100%)",
        }}
      />
    </div>
  );
}
