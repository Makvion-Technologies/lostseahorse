"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createSeededRandom } from "@/utils/seededRandom";

const PARTICLE_COUNT = 120;

interface ParticlesProps {
  reducedMotion?: boolean;
}

/** Floating dust / plankton particles for underwater atmosphere. */
export function Particles({ reducedMotion = false }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const rand = createSeededRandom(42);
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (rand() - 0.5) * 14;
      positions[i * 3 + 1] = (rand() - 0.5) * 10;
      positions[i * 3 + 2] = (rand() - 0.5) * 8 - 1;
      speeds[i] = 0.05 + rand() * 0.12;
    }

    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    if (reducedMotion || !pointsRef.current) return;

    const attr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    const array = attr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      array[i * 3 + 1] += speeds[i] * delta;
      array[i * 3] += Math.sin(array[i * 3 + 1] * 0.4 + i) * 0.002;

      if (array[i * 3 + 1] > 5) {
        array[i * 3 + 1] = -5;
        // Deterministic recycle position from particle index
        array[i * 3] = (((i * 17) % 100) / 100 - 0.5) * 14;
      }
    }

    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#a5f3fc"
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
