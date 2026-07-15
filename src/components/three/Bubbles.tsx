"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { createSeededRandom } from "@/utils/seededRandom";

const BUBBLE_COUNT = 28;

interface BubbleData {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
  sway: number;
  phase: number;
}

interface BubblesProps {
  reducedMotion?: boolean;
}

/** Gentle rising bubbles for the underwater scene. */
export function Bubbles({ reducedMotion = false }: BubblesProps) {
  const groupRef = useRef<Group>(null);

  const bubbles = useMemo<BubbleData[]>(() => {
    const rand = createSeededRandom(7);
    return Array.from({ length: BUBBLE_COUNT }, () => ({
      x: (rand() - 0.5) * 12,
      y: (rand() - 0.5) * 10,
      z: (rand() - 0.5) * 6 - 0.5,
      scale: 0.02 + rand() * 0.07,
      speed: 0.15 + rand() * 0.35,
      sway: 0.15 + rand() * 0.35,
      phase: rand() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return;

    const t = state.clock.elapsedTime;
    const children = groupRef.current.children;

    for (let i = 0; i < children.length; i++) {
      const mesh = children[i] as Mesh;
      const data = bubbles[i];
      const y = ((data.y + t * data.speed + 5) % 10) - 5;
      const x = data.x + Math.sin(t * 0.5 + data.phase) * data.sway * 0.15;

      mesh.position.set(x, y, data.z);
      mesh.scale.setScalar(data.scale * (1 + Math.sin(t + data.phase) * 0.08));
    }
  });

  return (
    <group ref={groupRef}>
      {bubbles.map((bubble, index) => (
        <mesh
          key={index}
          position={[bubble.x, bubble.y, bubble.z]}
          scale={bubble.scale}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial
            color="#e0f2fe"
            transparent
            opacity={0.22}
            metalness={0.1}
            roughness={0.1}
            emissive="#67e8f9"
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}
