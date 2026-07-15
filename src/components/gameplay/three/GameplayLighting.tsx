"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type {
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  PointLight,
} from "three";
import { combatRuntime } from "@/game/combat/CombatRuntime";

interface GameplayLightingProps {
  reducedMotion?: boolean;
  /** 0–1 environment brightness boost after intro. */
  intensity?: number;
  /** Seahorse X — key lights follow the arena layout. */
  focusX?: number;
}

/**
 * Multi-light setup: seahorse stays the brightest subject.
 * Dims during game-over cinematic.
 */
export function GameplayLighting({
  reducedMotion = false,
  intensity = 1,
  focusX = 0,
}: GameplayLightingProps) {
  const ambRef = useRef<AmbientLight>(null);
  const hemiRef = useRef<HemisphereLight>(null);
  const dirRef = useRef<DirectionalLight>(null);
  const underRef = useRef<DirectionalLight>(null);
  const keyRef = useRef<PointLight>(null);
  const fillRef = useRef<PointLight>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useFrame((state) => {
    const go = combatRuntime.gameOverProgress;
    const i = intensityRef.current * (1 - go * 0.7);
    const pulse = reducedMotion
      ? 1
      : 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.06 * (1 - go);

    if (ambRef.current) ambRef.current.intensity = 0.55 + i * 0.25;
    if (hemiRef.current) hemiRef.current.intensity = 0.55 + i * 0.3;
    if (dirRef.current) dirRef.current.intensity = 1.0 + i * 0.5;
    if (underRef.current) underRef.current.intensity = 0.35 + i * 0.2;
    if (keyRef.current) {
      keyRef.current.intensity = (1.7 + i * 0.7) * pulse;
    }
    if (fillRef.current) fillRef.current.intensity = 0.55 + i * 0.3;
  });

  return (
    <>
      {/* Strong ambient so subjects read even without env maps */}
      <ambientLight ref={ambRef} intensity={0.7} color="#9ee7f5" />

      <hemisphereLight
        ref={hemiRef}
        args={["#a5f3fc", "#0a1f2e", 0.75]}
        position={[0, 4, 0]}
      />

      <directionalLight
        ref={dirRef}
        position={[2.5, 7, 3]}
        intensity={1.35}
        color="#e0f2fe"
        castShadow={false}
      />

      <directionalLight
        ref={underRef}
        position={[-1, -4, 1]}
        intensity={0.45}
        color="#14b8a6"
      />

      <pointLight
        ref={keyRef}
        position={[focusX + 0.4, 0.6, 2.2]}
        intensity={2.2}
        color="#5eead4"
        distance={12}
        decay={1.6}
      />

      <pointLight
        ref={fillRef}
        position={[focusX - 1.2, -0.4, 1.2]}
        intensity={0.8}
        color="#38bdf8"
        distance={10}
        decay={1.6}
      />
    </>
  );
}
