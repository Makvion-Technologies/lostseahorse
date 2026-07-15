"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import * as THREE from "three";

interface GameplayLightRaysProps {
  reducedMotion?: boolean;
  intensity?: number;
}

export function GameplayLightRays({
  reducedMotion = false,
  intensity = 1,
}: GameplayLightRaysProps) {
  const rayA = useRef<Mesh>(null);
  const rayB = useRef<Mesh>(null);
  const rayC = useRef<Mesh>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const matsRef = useRef<THREE.MeshBasicMaterial[] | null>(null);
  if (!matsRef.current) {
    matsRef.current = [
      new THREE.MeshBasicMaterial({
        color: "#7dd3fc",
        transparent: true,
        opacity: 0.05,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshBasicMaterial({
        color: "#a5f3fc",
        transparent: true,
        opacity: 0.04,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshBasicMaterial({
        color: "#67e8f9",
        transparent: true,
        opacity: 0.035,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    ];
  }

  useFrame((state) => {
    const materials = matsRef.current;
    if (!materials) return;

    const t = state.clock.elapsedTime;
    const base = 0.028 + intensityRef.current * 0.035;

    materials[0].opacity =
      base + (reducedMotion ? 0 : Math.sin(t * 0.28) * 0.012);
    materials[1].opacity =
      base * 0.85 + (reducedMotion ? 0 : Math.cos(t * 0.22) * 0.01);
    materials[2].opacity = base * 0.7;

    if (reducedMotion) return;

    if (rayA.current) {
      rayA.current.rotation.z = -0.32 + Math.sin(t * 0.14) * 0.035;
    }
    if (rayB.current) {
      rayB.current.rotation.z = 0.18 + Math.cos(t * 0.11) * 0.028;
    }
    if (rayC.current) {
      rayC.current.rotation.z = 0.04 + Math.sin(t * 0.09 + 1) * 0.022;
    }
  });

  const materials = matsRef.current;

  return (
    <group position={[0, 2.8, -2.5]}>
      <mesh
        ref={rayA}
        position={[-1.4, 0, 0]}
        rotation={[0.12, 0, -0.32]}
        material={materials[0]}
      >
        <planeGeometry args={[1.5, 11]} />
      </mesh>
      <mesh
        ref={rayB}
        position={[0.5, 0, 0.15]}
        rotation={[0.1, 0, 0.18]}
        material={materials[1]}
      >
        <planeGeometry args={[1.15, 10]} />
      </mesh>
      <mesh
        ref={rayC}
        position={[2.1, 0, -0.25]}
        rotation={[0.11, 0, 0.04]}
        material={materials[2]}
      >
        <planeGeometry args={[0.85, 9]} />
      </mesh>
    </group>
  );
}
