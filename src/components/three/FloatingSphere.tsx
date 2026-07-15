"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import type { MouseParallax } from "@/hooks/useMouseParallax";

interface FloatingSphereProps {
  mouse: MouseParallax;
  reducedMotion?: boolean;
}

/**
 * Placeholder centerpiece for Phase 1.
 * Will be replaced by the GLB seahorse model later.
 */
export function FloatingSphere({
  mouse,
  reducedMotion = false,
}: FloatingSphereProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  useFrame((state) => {
    const group = groupRef.current;
    const mesh = meshRef.current;
    const glow = glowRef.current;
    if (!group || !mesh) return;

    const t = state.clock.elapsedTime;

    if (reducedMotion) {
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      return;
    }

    // Gentle vertical float
    const floatY = Math.sin(t * 0.6) * 0.18;
    // Subtle mouse parallax (sphere reacts slightly)
    const targetX = mouse.x * 0.22;
    const targetY = floatY + mouse.y * -0.12;

    group.position.x += (targetX - group.position.x) * 0.04;
    group.position.y += (targetY - group.position.y) * 0.04;

    // Slow continuous rotation
    mesh.rotation.y = t * 0.35;
    mesh.rotation.x = Math.sin(t * 0.25) * 0.12;
    mesh.rotation.z = Math.cos(t * 0.2) * 0.08;

    if (glow) {
      const pulse = 1 + Math.sin(t * 1.2) * 0.06;
      glow.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Soft outer glow shell */}
      <mesh ref={glowRef} scale={1.35}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#5eead4"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Main glowing sphere */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#0d9488"
          emissive="#14b8a6"
          emissiveIntensity={0.55}
          metalness={0.35}
          roughness={0.25}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Inner highlight core */}
      <mesh scale={0.55}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#99f6e4"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
