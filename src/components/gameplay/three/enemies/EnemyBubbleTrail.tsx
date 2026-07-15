"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ENEMY_CONFIG } from "@/game/constants/enemies";

interface EnemyBubbleTrailProps {
  intensity?: number;
  reducedMotion?: boolean;
}

interface TrailBubble {
  baseX: number;
  baseY: number;
  phase: number;
  speed: number;
  scale: number;
}

/**
 * Lightweight bubble trail in local word space — few particles, shared material.
 */
export function EnemyBubbleTrail({
  intensity = 1,
  reducedMotion = false,
}: EnemyBubbleTrailProps) {
  const groupRef = useRef<THREE.Group>(null);
  const count = ENEMY_CONFIG.TRAIL_BUBBLE_COUNT;

  const matRef = useRef<THREE.MeshBasicMaterial | null>(null);
  if (!matRef.current) {
    matRef.current = new THREE.MeshBasicMaterial({
      color: "#a5f3fc",
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
  }

  const bubbles = useMemo<TrailBubble[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        baseX: (i - count / 2) * 0.04,
        baseY: -0.08 - i * 0.05,
        phase: i * 1.3,
        speed: 0.12 + i * 0.03,
        scale: 0.018 + (i % 3) * 0.006,
      })),
    [count],
  );

  useFrame((state) => {
    const group = groupRef.current;
    const mat = matRef.current;
    if (!group || !mat) return;

    mat.opacity = 0.08 + intensity * 0.12;
    if (reducedMotion) return;

    const t = state.clock.elapsedTime;
    const children = group.children;

    for (let i = 0; i < children.length; i++) {
      const mesh = children[i] as THREE.Mesh;
      const b = bubbles[i];
      const rise = (t * b.speed + b.phase) % 0.55;
      mesh.position.set(
        b.baseX + Math.sin(t * 1.5 + b.phase) * 0.02,
        b.baseY + rise,
        0,
      );
      const life = 1 - rise / 0.55;
      mesh.scale.setScalar(b.scale * (0.6 + life * 0.5));
    }
  });

  return (
    <group ref={groupRef}>
      {bubbles.map((b, i) => (
        <mesh key={i} material={matRef.current!} scale={b.scale}>
          <sphereGeometry args={[1, 6, 6]} />
        </mesh>
      ))}
    </group>
  );
}
