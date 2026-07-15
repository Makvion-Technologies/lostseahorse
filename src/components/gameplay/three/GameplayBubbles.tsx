"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createSeededRandom } from "@/utils/seededRandom";
import { GAME_CONFIG } from "@/game/constants/config";

interface BubbleData {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
  sway: number;
  phase: number;
}

interface GameplayBubblesProps {
  reducedMotion?: boolean;
  intensity?: number;
  densityScale?: number;
}

const SHARED_GEO = new THREE.SphereGeometry(1, 10, 10);

export function GameplayBubbles({
  reducedMotion = false,
  intensity = 1,
  densityScale = 1,
}: GameplayBubblesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;
  const count = Math.max(
    4,
    Math.round(GAME_CONFIG.GAMEPLAY_BUBBLE_COUNT * densityScale),
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e0f2fe",
        transparent: true,
        opacity: 0.18,
        metalness: 0.15,
        roughness: 0.12,
        emissive: "#67e8f9",
        emissiveIntensity: 0.12,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const bubbles = useMemo(() => {
    const rand = createSeededRandom(33);
    return Array.from({ length: count }, (): BubbleData => ({
      x: (rand() - 0.5) * 14,
      y: (rand() - 0.5) * 11,
      z: (rand() - 0.5) * 7 - 0.5,
      scale: 0.018 + rand() * 0.055,
      speed: 0.12 + rand() * 0.28,
      sway: 0.12 + rand() * 0.3,
      phase: rand() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const intensityValue = intensityRef.current;
    material.opacity = 0.1 + intensityValue * 0.14;
    material.emissiveIntensity = 0.08 + intensityValue * 0.1;

    if (reducedMotion) return;

    const t = state.clock.elapsedTime;
    const children = group.children;

    for (let i = 0; i < children.length; i++) {
      const mesh = children[i] as THREE.Mesh;
      const data = bubbles[i];
      if (!data) continue;
      const y =
        ((data.y + t * data.speed * (0.85 + intensityValue * 0.25) + 5.5) %
          11) -
        5.5;
      const x = data.x + Math.sin(t * 0.45 + data.phase) * data.sway * 0.14;
      mesh.position.set(x, y, data.z);
      mesh.scale.setScalar(
        data.scale *
          (1 + Math.sin(t + data.phase) * 0.07) *
          (0.9 + intensityValue * 0.15),
      );
    }
  });

  return (
    <group ref={groupRef}>
      {bubbles.map((bubble, index) => (
        <mesh
          key={index}
          geometry={SHARED_GEO}
          position={[bubble.x, bubble.y, bubble.z]}
          scale={bubble.scale}
          material={material}
        />
      ))}
    </group>
  );
}
