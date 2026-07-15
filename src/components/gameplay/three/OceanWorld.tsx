"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getArenaTarget } from "@/game/constants/arena";
import { useGameStore } from "@/game/state/useGameStore";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { GameplayParticles } from "./GameplayParticles";
import { GameplayBubbles } from "./GameplayBubbles";
import { GameplayLightRays } from "./GameplayLightRays";
import { Caustics } from "./Caustics";
import { GameplayLighting } from "./GameplayLighting";
import { Seahorse } from "./Seahorse";
import { SpawnRingDebug } from "./SpawnRingDebug";
import { IncomingPathsDebug } from "./IncomingPathsDebug";
import { EnemyWordLayer } from "./enemies/EnemyWordLayer";
import { CombatLayer } from "./combat/CombatLayer";
import { StatsEngineBridge } from "./StatsEngineBridge";

interface OceanWorldProps {
  reducedMotion?: boolean;
  /** 0–1 scene intro / readiness. */
  introProgress: number;
  /** Multiplier from particle density setting. */
  particleScale?: number;
}

/**
 * Full underwater arena for gameplay — independent of the landing canvas.
 * Avoids ContactShadows / Environment HDR (heavy, context-loss prone).
 */
export function OceanWorld({
  reducedMotion = false,
  introProgress,
  particleScale = 1,
}: OceanWorldProps) {
  const layout = useGameStore((s) => s.selectedArenaLayout);
  const arenaTarget = useMemo(() => getArenaTarget(layout), [layout]);
  const baseIntensity = 0.35 + introProgress * 0.65;
  const intensityRef = useRef(baseIntensity);
  const fogRef = useRef<THREE.Fog | null>(null);
  const bgRef = useRef<THREE.Color | null>(null);

  useFrame(() => {
    const go = combatRuntime.gameOverProgress;
    intensityRef.current = baseIntensity * (1 - go * 0.65);
    if (fogRef.current) {
      fogRef.current.near = 5.5 - go * 1.5;
      fogRef.current.far = 18 - go * 6;
      fogRef.current.color.setRGB(
        0.008 * (1 - go * 0.7),
        0.063 * (1 - go * 0.75),
        0.094 * (1 - go * 0.6),
      );
    }
    if (bgRef.current) {
      bgRef.current.setRGB(
        0.008 * (1 - go * 0.8),
        0.063 * (1 - go * 0.85),
        0.094 * (1 - go * 0.7),
      );
    }
  });

  const intensity = intensityRef.current;

  return (
    <>
      <color
        ref={(c) => {
          bgRef.current = c;
        }}
        attach="background"
        args={["#021018"]}
      />
      <fog
        ref={(f) => {
          fogRef.current = f;
        }}
        attach="fog"
        args={["#021018", 5.5, 18]}
      />

      <GameplayLighting
        reducedMotion={reducedMotion}
        intensity={intensity}
        focusX={arenaTarget.x}
      />

      <GameplayParticles
        reducedMotion={reducedMotion}
        intensity={intensity}
        densityScale={particleScale}
      />
      <GameplayBubbles
        reducedMotion={reducedMotion}
        intensity={intensity}
        densityScale={particleScale}
      />
      <GameplayLightRays reducedMotion={reducedMotion} intensity={intensity} />
      <Caustics reducedMotion={reducedMotion} intensity={intensity} />

      {/* Soft ground plane under the seahorse */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[arenaTarget.x, arenaTarget.y - 1.55, arenaTarget.z]}
        receiveShadow={false}
      >
        <circleGeometry args={[5.5, 48]} />
        <meshBasicMaterial
          color="#020617"
          transparent
          opacity={0.35 + introProgress * 0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Beacon under seahorse */}
      <mesh
        position={[arenaTarget.x, arenaTarget.y, arenaTarget.z - 0.4]}
      >
        <ringGeometry args={[0.85, 1.05, 48]} />
        <meshBasicMaterial
          color="#2dd4bf"
          transparent
          opacity={0.22 + introProgress * 0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <Seahorse reducedMotion={reducedMotion} introProgress={introProgress} />

      <EnemyWordLayer
        reducedMotion={reducedMotion}
        introProgress={introProgress}
      />

      <CombatLayer reducedMotion={reducedMotion} densityScale={particleScale} />
      <StatsEngineBridge />

      <SpawnRingDebug />
      <IncomingPathsDebug />
    </>
  );
}
