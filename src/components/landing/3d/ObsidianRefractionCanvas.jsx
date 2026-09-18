import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Bioluminescent & Obsidian Color Spectrum
const LIME_GLOW = new THREE.Color("#bef264");
const CYAN_GLOW = new THREE.Color("#38bdf8");
const EMERALD_GLOW = new THREE.Color("#10b981");
const OBSIDIAN_DEEP = new THREE.Color("#050807");
const OBSIDIAN_CORE = new THREE.Color("#08140e");

/**
 * Procedural dual-hemisphere brain geometry with high-resolution gyri & sulci folds
 */
function buildOrganicBrainGeometry() {
  const geo = new THREE.SphereGeometry(1.4, 140, 110);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Deep sagittal fissure separating left and right hemispheres
    const fissure = Math.exp(-v.x * v.x * 16.0) * 0.26;

    // Multi-octave harmonic gyri/sulci convolutions
    const harmonic1 = Math.sin(v.x * 7.2 + v.y * 8.6) * Math.cos(v.z * 6.2) * 0.075;
    const harmonic2 = Math.sin(v.x * 14.5 + v.z * 12.8) * Math.cos(v.y * 10.4 + 1.4) * 0.042;
    const harmonic3 = Math.sin(v.y * 22.0 + v.x * 18.0 + v.z * 11.0) * 0.022;

    // Temporal lobe bulge and frontal pole elongation
    const frontalBulge = v.z > 0.4 ? Math.sin((v.z - 0.4) * 2.5) * 0.08 : 0;
    const temporalBulge = Math.abs(v.x) > 0.6 && v.y < 0.1 && v.y > -0.5 ? 0.09 : 0;
    const cerebellarCut = v.y < -0.32 ? (v.y + 0.32) * 0.38 : 0;

    const r = v.length();
    const displacement = -fissure + harmonic1 + harmonic2 + harmonic3 + frontalBulge + temporalBulge + cerebellarCut;
    const newR = r * (1 + displacement);

    v.normalize().multiplyScalar(newR);
    v.x *= 1.22; // lateral cranial width
    v.y *= 0.88; // vertical cranial height
    v.z *= 1.12; // anterior-posterior length

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates synaptic arcs firing across cortical regions
 */
function generateSynapticArcs(count = 14) {
  const arcs = [];
  const r = 1.39;

  for (let k = 0; k < count; k++) {
    const theta1 = (k / count) * Math.PI * 2 + Math.random() * 0.35;
    const phi1 = Math.acos(2 * Math.random() - 1);
    const start = new THREE.Vector3(
      r * Math.sin(phi1) * Math.cos(theta1) * 1.22,
      r * Math.sin(phi1) * Math.sin(theta1) * 0.88,
      r * Math.cos(phi1) * 1.12
    );

    const theta2 = theta1 + (Math.random() > 0.5 ? 1.4 : -1.4);
    const phi2 = Math.acos(2 * Math.random() - 1);
    const end = new THREE.Vector3(
      r * Math.sin(phi2) * Math.cos(theta2) * 1.22,
      r * Math.sin(phi2) * Math.sin(theta2) * 0.88,
      r * Math.cos(phi2) * 1.12
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
 * 8 Cortical Node Markers positioned around real neural regions
 */
const CORTICAL_NODES = [
  { id: "pfc_left", pos: [-0.68, 0.42, 1.05], color: "#bef264" },
  { id: "pfc_right", pos: [0.68, 0.42, 1.05], color: "#bef264" },
  { id: "hippocampus_l", pos: [-0.88, -0.15, 0.22], color: "#38bdf8" },
  { id: "hippocampus_r", pos: [0.88, -0.15, 0.22], color: "#38bdf8" },
  { id: "parietal_l", pos: [-0.78, 0.62, -0.52], color: "#bef264" },
  { id: "parietal_r", pos: [0.78, 0.62, -0.52], color: "#bef264" },
  { id: "occipital", pos: [0.0, 0.12, -1.35], color: "#38bdf8" },
  { id: "insula", pos: [0.0, -0.32, 0.62], color: "#10b981" },
];

/**
 * Gyroscopic Precision Ring
 */
function GyroRing({ radius = 2.4, axis = "x", speed = 0.35, color = "#bef264", opacity = 0.22 }) {
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
 * Internal Synaptic Pulse Light
 */
function InternalSynapticPulse() {
  const lightRef = useRef();
  const lightRef2 = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t * 1.5) * 0.6;
      lightRef.current.position.y = Math.cos(t * 1.8) * 0.35;
      lightRef.current.position.z = Math.sin(t * 1.2) * 0.6;
      lightRef.current.intensity = 2.6 + Math.sin(t * 3.8) * 1.2;
    }
    if (lightRef2.current) {
      lightRef2.current.position.x = -Math.cos(t * 1.3) * 0.5;
      lightRef2.current.position.y = -Math.sin(t * 1.5) * 0.35;
      lightRef2.current.position.z = Math.cos(t * 1.7) * 0.5;
      lightRef2.current.intensity = 2.0 + Math.cos(t * 3.2) * 0.9;
    }
  });

  return (
    <>
      <pointLight ref={lightRef} color="#bef264" distance={3.8} decay={2} />
      <pointLight ref={lightRef2} color="#38bdf8" distance={3.8} decay={2} />
    </>
  );
}

/**
 * Frosted Obsidian Cortex Mesh positioned for the Asymmetric Studio layout
 */
function ObsidianCortex({ mouseX, mouseY, scrollProgress, isMobile }) {
  const meshGroup = useRef();
  const innerCoreRef = useRef();

  const geo = useMemo(() => buildOrganicBrainGeometry(), []);
  const synapticArcs = useMemo(() => generateSynapticArcs(14), []);

  // 1. Inner Thalamic / Cortical Bioluminescent Core (Gives the glass real physical mass and internal light)
  const innerCoreMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: OBSIDIAN_CORE,
      roughness: 0.22,
      metalness: 0.85,
      emissive: LIME_GLOW,
      emissiveIntensity: 0.22,
    });
  }, []);

  // 2. Studio-grade Frosted Obsidian Glass Body with high refractive transmission and emerald-cyan caustics
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#07100b"),
      roughness: 0.16,
      metalness: 0.12,
      transmission: 0.88, // crystalline transmission revealing the inner firing core
      ior: 1.52, // crown glass refraction index
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

  // 3. Sub-surface Neural Wireframe Filament for sharp anatomical definition
  const filamentMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: LIME_GLOW,
      wireframe: true,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state, delta) => {
    if (!meshGroup.current) return;
    const t = state.clock.getElapsedTime();
    const p = THREE.MathUtils.clamp(scrollProgress.current || 0, 0, 1);

    // Responsive position: On desktop, offset right to 1.35; on mobile, center at 0
    const targetX = isMobile ? 0 : 1.35;
    const targetY = isMobile ? 0.35 : -0.05;
    meshGroup.current.position.x = THREE.MathUtils.damp(meshGroup.current.position.x, targetX, 3, delta);
    meshGroup.current.position.y = THREE.MathUtils.damp(meshGroup.current.position.y, targetY, 3, delta);

    // Dynamic rotation: mouse parallax + continuous idle drift + scroll-scrubbed choreography
    const rotX = (mouseY.current * 0.35) + Math.sin(t * 0.35) * 0.04 + (p * 1.8);
    const rotY = (mouseX.current * 0.45) + (t * 0.12) + (p * 3.6);

    meshGroup.current.rotation.x = THREE.MathUtils.damp(meshGroup.current.rotation.x, rotX, 4, delta);
    meshGroup.current.rotation.y = THREE.MathUtils.damp(meshGroup.current.rotation.y, rotY, 4, delta);

    // Breathing pulse
    const breath = 1 + Math.sin(t * 1.4) * 0.016;
    if (innerCoreRef.current) {
      innerCoreRef.current.scale.set(0.97 * breath, 0.97 * breath, 0.97 * breath);
    }
  });

  return (
    <group ref={meshGroup} position={[isMobile ? 0 : 1.35, 0, 0]}>
      {/* 1. Deep Obsidian Inner Core */}
      <mesh ref={innerCoreRef} geometry={geo} material={innerCoreMaterial} scale={0.97} />

      {/* 2. Outer Frosted Obsidian Glass Cortex */}
      <mesh geometry={geo} material={glassMaterial} castShadow receiveShadow />

      {/* 3. Outer Synaptic Wireframe Sheen */}
      <mesh geometry={geo} material={filamentMaterial} scale={1.012} />

      {/* 4. Synaptic Arcs firing between lobes */}
      {synapticArcs.map((arc, idx) => (
        <lineSegments key={idx} geometry={arc.geo}>
          <lineBasicMaterial color={arc.color} transparent opacity={0.65} linewidth={1.5} />
        </lineSegments>
      ))}

      {/* 5. Cortical Nodes */}
      {CORTICAL_NODES.map((node) => (
        <group key={node.id} position={node.pos}>
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color={node.color} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.06, 0.08, 20]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* 6. Gyroscopic Telemetry Rings */}
      <GyroRing radius={2.15} axis="y" speed={0.22} color="#bef264" opacity={0.24} />
      <GyroRing radius={2.35} axis="x" speed={-0.16} color="#38bdf8" opacity={0.2} />

      {/* 7. Internal Firing Light Caustics */}
      <InternalSynapticPulse />
    </group>
  );
}

/**
 * Floating Ambient Photon Aura around the cortex
 */
function PhotonAura({ count = 220, isMobile }) {
  const auraRef = useRef();

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 1.9 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return [pos];
  }, [count]);

  useFrame(({ clock }) => {
    if (!auraRef.current) return;
    const t = clock.getElapsedTime() * 0.12;
    auraRef.current.rotation.y = t * 0.45;
    auraRef.current.rotation.x = Math.sin(t * 0.2) * 0.12;
  });

  return (
    <group position={[isMobile ? 0 : 1.35, 0, 0]}>
      <points ref={auraRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#bef264"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function ObsidianRefractionCanvas({ scrollProgress = { current: 0 } }) {
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      mouseX.current = (e.clientX / innerWidth) * 2 - 1;
      mouseY.current = -(e.clientY / innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
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
        <color attach="background" args={["#050807"]} />

        {/* Studio Lighting Setup: Sharp specular highlights and dramatic rim contrast */}
        <ambientLight intensity={0.65} />
        
        {/* Soft Key Light from top-right */}
        <directionalLight position={[5, 7, 4]} intensity={2.8} color="#f4fbf7" />

        {/* Electric Lime Accent Rim Light from rear-left */}
        <directionalLight position={[-6, 3, -3]} intensity={3.8} color="#bef264" />

        {/* Bioluminescent Cyan Bottom Bounce */}
        <directionalLight position={[3, -5, -2]} intensity={2.4} color="#38bdf8" />

        {/* Top-down crisp highlight */}
        <directionalLight position={[0, 8, 0]} intensity={1.5} color="#ffffff" />

        {/* 3D Asymmetric Cortex & Particles */}
        <ObsidianCortex
          mouseX={mouseX}
          mouseY={mouseY}
          scrollProgress={scrollProgress}
          isMobile={isMobile}
        />
        <PhotonAura isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
