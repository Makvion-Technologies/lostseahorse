"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";

interface LightRaysProps {
  reducedMotion?: boolean;
}

/**
 * Soft volumetric-style light shafts through water.
 * Implemented as translucent planes with gentle sway.
 */
export function LightRays({ reducedMotion = false }: LightRaysProps) {
  const rayA = useRef<Mesh>(null);
  const rayB = useRef<Mesh>(null);
  const rayC = useRef<Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;

    if (rayA.current) {
      rayA.current.rotation.z = -0.35 + Math.sin(t * 0.15) * 0.04;
      const mat = rayA.current.material as MeshBasicMaterial;
      mat.opacity = 0.04 + Math.sin(t * 0.3) * 0.015;
    }
    if (rayB.current) {
      rayB.current.rotation.z = 0.2 + Math.cos(t * 0.12) * 0.03;
      const mat = rayB.current.material as MeshBasicMaterial;
      mat.opacity = 0.03 + Math.cos(t * 0.25) * 0.012;
    }
    if (rayC.current) {
      rayC.current.rotation.z = 0.05 + Math.sin(t * 0.1 + 1) * 0.025;
    }
  });

  return (
    <group position={[0, 2.5, -2]}>
      <mesh ref={rayA} position={[-1.2, 0, 0]} rotation={[0.15, 0, -0.35]}>
        <planeGeometry args={[1.4, 10]} />
        <meshBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={0.05}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={rayB} position={[0.6, 0, 0.2]} rotation={[0.1, 0, 0.2]}>
        <planeGeometry args={[1.1, 9]} />
        <meshBasicMaterial
          color="#a5f3fc"
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={rayC} position={[2, 0, -0.3]} rotation={[0.12, 0, 0.05]}>
        <planeGeometry args={[0.8, 8]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0.035}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
