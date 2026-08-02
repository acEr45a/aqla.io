import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Real 3D brain model — 344 anatomical structures, Draco-compressed.
// Source: itayinbarr/brainproject (CC BY-SA, derived from Z-Anatomy + open atlases).
const BRAIN_URL =
  "https://raw.githubusercontent.com/itayinbarr/brainproject/main/brain-atlas/models/brain.glb";

export default function BrainGLBView({ tint = "#C9F24E" }) {
  const containerRef = useRef(null);
  const modelRef = useRef(null);
  const materialRef = useRef(null);
  const drag = useRef({ active: false, lastX: 0, lastY: 0, lastInteract: 0 });
  const target = useRef({ x: -0.12, y: 0.5 });
  const current = useRef({ x: -0.12, y: 0.5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Scene setup (once)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let width = container.clientWidth || 600;
    let height = container.clientHeight || 500;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "grab";

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.01, 100);
    camera.position.set(0, 0.05, 3.1);

    // Studio environment for glass/clearcoat reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    envScene.dispose && envScene.dispose();

    // Cinematic lighting rig
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xC9F24E, 1.4);
    rim.position.set(-4, 2.5, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0x7B94FF, 0.9);
    fill.position.set(0, -3, 4);
    scene.add(fill);

    // Premium frosted-glass material shared across all structures
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x353535),
      roughness: 0.32,
      metalness: 0.35,
      clearcoat: 0.85,
      clearcoatRoughness: 0.28,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 1.25,
      emissive: new THREE.Color(tint),
      emissiveIntensity: 0.08,
    });
    materialRef.current = mat;

    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(
      BRAIN_URL,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.1 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.traverse((obj) => {
          if (obj.isMesh) {
            obj.material = mat;
            obj.castShadow = false;
            obj.receiveShadow = false;
          }
        });
        scene.add(model);
        modelRef.current = model;
        setLoading(false);
      },
      undefined,
      () => setError(true)
    );

    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!drag.current.active && performance.now() - drag.current.lastInteract > 1800) {
        target.current.y += 0.0026;
      }
      current.current.x += (target.current.x - current.current.x) * 0.09;
      current.current.y += (target.current.y - current.current.y) * 0.09;
      if (modelRef.current) {
        modelRef.current.rotation.x = current.current.x;
        modelRef.current.rotation.y = current.current.y;
      }
      renderer.render(scene, camera);
    };
    loop();

    const el = renderer.domElement;
    const onDown = (e) => {
      drag.current.active = true;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      drag.current.lastInteract = performance.now();
      el.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.lastX;
      const dy = e.clientY - drag.current.lastY;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      drag.current.lastInteract = performance.now();
      target.current.x = Math.max(-1.2, Math.min(1.2, target.current.x + dy * 0.006));
      target.current.y += dx * 0.006;
    };
    const onUp = () => {
      drag.current.active = false;
      drag.current.lastInteract = performance.now();
      el.style.cursor = "grab";
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const ro = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      if (width && height) {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ro.disconnect();
      draco.dispose();
      loader.dracoWorker && loader.dracoWorker.dispose && loader.dracoWorker.dispose();
      mat.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update emissive tint when the selected domain changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.emissive = new THREE.Color(tint);
      materialRef.current.emissiveIntensity = 0.12;
    }
  }, [tint]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading 3D brain model…</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="text-xs text-muted-foreground">
            The 3D model couldn't load in this preview. It will render in the published app.
          </p>
        </div>
      )}
    </div>
  );
}