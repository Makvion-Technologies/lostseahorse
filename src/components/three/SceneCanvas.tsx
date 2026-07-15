"use client";

import { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FloatingSphere } from "./FloatingSphere";
import { UnderwaterAtmosphere } from "./UnderwaterAtmosphere";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function CameraRig({
  mouse,
  reducedMotion,
}: {
  mouse: { x: number; y: number };
  reducedMotion: boolean;
}) {
  useFrame((state) => {
    const camera = state.camera;
    if (reducedMotion) {
      camera.position.set(0, 0, 5.5);
      camera.lookAt(0, 0, 0);
      return;
    }

    const targetX = mouse.x * 0.35;
    const targetY = mouse.y * -0.2;

    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;
    camera.position.z = 5.5;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function SceneCanvas() {
  const mouse = useMouseParallax();
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 -z-10 bg-[#021018]">
      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{ position: [0, 0, 5.5], fov: 42, near: 0.1, far: 40 }}
        style={{ width: "100%", height: "100%" }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = false;
          gl.setClearColor(new THREE.Color("#021018"), 0);
        }}
      >
        <Suspense fallback={null}>
          <UnderwaterAtmosphere reducedMotion={reducedMotion} />

          <ambientLight intensity={0.35} color="#7dd3fc" />
          <directionalLight
            position={[3, 6, 4]}
            intensity={1.1}
            color="#e0f2fe"
          />
          <pointLight
            position={[-3, 1, 2]}
            intensity={0.6}
            color="#2dd4bf"
            distance={12}
          />
          <pointLight
            position={[2, -2, 1]}
            intensity={0.35}
            color="#38bdf8"
            distance={10}
          />

          <FloatingSphere mouse={mouse} reducedMotion={reducedMotion} />

          {/* Soft shadow disc — no ContactShadows / soft-shadow map */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
            <circleGeometry args={[2.2, 32]} />
            <meshBasicMaterial
              color="#020617"
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>

          <CameraRig mouse={mouse} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
