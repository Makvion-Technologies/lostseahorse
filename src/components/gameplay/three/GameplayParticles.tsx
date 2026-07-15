"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createSeededRandom } from "@/utils/seededRandom";
import { GAME_CONFIG } from "@/game/constants/config";

interface GameplayParticlesProps {
  reducedMotion?: boolean;
  intensity?: number;
  densityScale?: number;
}

export function GameplayParticles({
  reducedMotion = false,
  intensity = 1,
  densityScale = 1,
}: GameplayParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const count = Math.max(
    12,
    Math.round(GAME_CONFIG.GAMEPLAY_PARTICLE_COUNT * densityScale),
  );

  const { positions, speeds, geometry } = useMemo(() => {
    const rand = createSeededRandom(101);
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 16;
      positions[i * 3 + 1] = (rand() - 0.5) * 12;
      positions[i * 3 + 2] = (rand() - 0.5) * 10 - 1;
      speeds[i] = 0.04 + rand() * 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    return { positions, speeds, geometry };
  }, [count]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    const mat = matRef.current;
    const points = pointsRef.current;
    if (!mat || !points) return;

    const intensityValue = intensityRef.current;
    mat.opacity = 0.18 + intensityValue * 0.32;

    if (reducedMotion) return;

    const attr = points.geometry.attributes.position as THREE.BufferAttribute;
    const array = attr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] += speeds[i] * delta * (0.7 + intensityValue * 0.5);
      array[i * 3] += Math.sin(array[i * 3 + 1] * 0.35 + i) * 0.0018;

      if (array[i * 3 + 1] > 6) {
        array[i * 3 + 1] = -6;
        array[i * 3] = (((i * 19) % 100) / 100 - 0.5) * 16;
      }
    }

    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={matRef}
        size={0.032}
        color="#a5f3fc"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
