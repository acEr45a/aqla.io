import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Procedural dual-hemisphere brain geometry with sulci/gyri folds
 */
function buildBrainGeometry() {
  const geo = new THREE.SphereGeometry(1.35, 120, 96);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Deep sagittal fissure
    const fissureDepth = Math.exp(-v.x * v.x * 14) * 0.22;

    // Multi-frequency harmonic gyri and sulci surface folds
    const fold1 = Math.sin(v.x * 6.5 + v.y * 8.2) * Math.cos(v.z * 5.4) * 0.068;
    const fold2 = Math.sin(v.x * 13.0 + v.z * 11.0) * Math.cos(v.y * 9.5 + 1.2) * 0.038;
    const fold3 = Math.sin(v.y * 18.0 + v.x * 15.0 + v.z * 9.0) * 0.019;

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
 * Procedural ambient caustics particle field (floating synaptic dust)
 */
function SynapticDust({ count = 280 }) {
  const pointsRef = useRef();

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = 2.0 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      scl[i] = Math.random();
    }
    return [pos, scl];
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime() * 0.15;
    pointsRef.current.rotation.y = t * 0.4;
    pointsRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#34d399"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Frosted Obsidian Glass Cortex with physical transmission & iridescent rim
 */
function ObsidianGlassMesh({ mouseX, mouseY, scrollProgress }) {
  const meshRef = useRef();
  const innerGlowRef = useRef();
  const geo = useMemo(() => buildBrainGeometry(), []);

  // Material setup: Unseen Studio-style frosted glass
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#080c10"),
      roughness: 0.18,
      metalness: 0.1,
      transmission: 0.92, // liquid frosted glass effect
      ior: 1.45,
      thickness: 1.2,
      specularIntensity: 1.0,
      specularColor: new THREE.Color("#6ee7b7"),
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      attenuationColor: new THREE.Color("#0d2e24"),
      attenuationDistance: 1.0,
      transparent: true,
      opacity: 0.92,
    });
  }, []);

  const wireHighlightMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#34d399"),
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const innerCoreMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#059669"),
      wireframe: false,
      transparent: true,
      opacity: 0.18,
    });
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    // Weightless gentle organic drift
    const targetRotX = (mouseY.current * 0.4) + Math.sin(t * 0.5) * 0.05 + (scrollProgress.current * 1.2);
    const targetRotY = (mouseX.current * 0.5) + t * 0.12 + (scrollProgress.current * 2.8);

    meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetRotX, 4, delta);
    meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetRotY, 4, delta);

    // Subtle floating breathing scale
    const breath = 1 + Math.sin(t * 1.2) * 0.02;
    meshRef.current.scale.set(breath, breath, breath);

    if (innerGlowRef.current) {
      innerGlowRef.current.rotation.y = -t * 0.2;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* 1. Main Frosted Obsidian Glass Body */}
      <mesh geometry={geo} material={glassMaterial} castShadow receiveShadow />

      {/* 2. Micro-thin Neural Wireframe Sheen */}
      <mesh geometry={geo} material={wireHighlightMaterial} scale={1.002} />

      {/* 3. Sub-surface bioluminescent thalamus core */}
      <mesh ref={innerGlowRef} geometry={geo} material={innerCoreMaterial} scale={0.78} />
    </group>
  );
}

/**
 * Main Unseen Glass Brain Canvas
 */
export default function UnseenGlassBrainCanvas({ scrollProgress = { current: 0 } }) {
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      mouseX.current = (e.clientX / innerWidth) * 2 - 1;
      mouseY.current = -(e.clientY / innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="w-full h-full"
      >
        <color attach="background" args={["#06080c"]} />

        {/* Cinematic Studio Lighting: Refractive edge rims & emerald fill */}
        <ambientLight intensity={0.6} />
        
        {/* Key directional light creating soft caustic highlights */}
        <directionalLight position={[4, 6, 4]} intensity={1.8} color="#f0fdf4" />
        
        {/* Emerald rim light accentuating glass curvature */}
        <directionalLight position={[-5, -3, -2]} intensity={2.2} color="#10b981" />
        
        {/* Deep cyan bottom bounce light */}
        <pointLight position={[0, -4, 2]} intensity={1.2} color="#06b6d4" distance={10} />

        {/* 3D Glass Object & Dust */}
        <ObsidianGlassMesh mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />
        <SynapticDust count={260} />
      </Canvas>
    </div>
  );
}
