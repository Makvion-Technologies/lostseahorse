"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ENEMY_CONFIG } from "@/game/constants/enemies";
import { EnemyState } from "@/game/types/Enemy";
import type { SpawnDirection } from "@/game/constants/world";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { EnemyBubbleTrail } from "./EnemyBubbleTrail";
import { EnemyDebugOverlay } from "./EnemyDebugOverlay";
import { PiranhaLabel, type PiranhaTone } from "./PiranhaLabel";

/**
 * Render-only props for a single enemy word.
 * Must not read Zustand or game systems — parent supplies state.
 */
export interface EnemyWordProps {
  id: string;
  displayText: string;
  originalText: string;
  position: { x: number; y: number; z: number };
  visualOffset: { x: number; y: number; z: number };
  rotation: number;
  scale: number;
  opacity: number;
  depth: number;
  isActive: boolean;
  isNext?: boolean;
  state: EnemyState;
  currentSpeed: number;
  distanceToCenter: number;
  progressPercentage: number;
  reducedMotion?: boolean;
  /** Used to face the piranha toward the seahorse / travel direction */
  spawnDirection?: SpawnDirection;
  velocityX?: number;
}

/**
 * Piranha-word entity — fish silhouette carrying remaining letters.
 * Active = gold piranha · Next = muted amber · Others = teal · Wrong = red flash.
 */
export function EnemyWord({
  id,
  displayText,
  originalText,
  position,
  visualOffset,
  rotation,
  scale,
  opacity,
  depth,
  isActive,
  isNext = false,
  state,
  currentSpeed,
  distanceToCenter,
  progressPercentage,
  reducedMotion = false,
  spawnDirection = "left",
  velocityX = 0,
}: EnemyWordProps) {
  const rootRef = useRef<THREE.Group>(null);
  const fishRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const shiftX = useRef(0);
  const prevLen = useRef(displayText.length);
  const destroyAge = useRef(0);

  const showAsNext = isNext && !isActive;

  // Mouth leads (points at the seahorse / travel direction); tail trails behind.
  // Swimming right (+X) → mouth faces right; swimming left → mouth faces left.
  const faceRight =
    Math.abs(velocityX) > 0.02
      ? velocityX > 0
      : spawnDirection === "left";

  // Bubbles trail off the tail (opposite of mouth)
  const trailX = faceRight ? -0.5 : 0.5;

  const propsRef = useRef({
    position,
    visualOffset,
    scale,
    opacity,
    isActive,
    showAsNext,
    state,
    displayText,
  });
  propsRef.current = {
    position,
    visualOffset,
    scale,
    opacity,
    isActive,
    showAsNext,
    state,
    displayText,
  };

  useEffect(() => {
    const len = displayText.length;
    if (len < prevLen.current) {
      shiftX.current = 0.1;
    }
    prevLen.current = len;
  }, [displayText]);

  const isCompleted = state === EnemyState.COMPLETED;
  const isDestroying = state === EnemyState.DESTROYING;
  const visibleText = isCompleted || isDestroying ? "" : displayText;

  useFrame((_clockState, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const p = propsRef.current;
    const dt = Math.min(delta, 0.05);

    if (Math.abs(shiftX.current) > 0.0005) {
      shiftX.current = THREE.MathUtils.damp(shiftX.current, 0, 18, dt);
    } else {
      shiftX.current = 0;
    }
    if (fishRef.current) {
      fishRef.current.position.x = shiftX.current;
    }

    const displayX = p.position.x + p.visualOffset.x;
    const displayY = p.position.y + p.visualOffset.y;
    const displayZ = p.position.z + p.visualOffset.z;

    let deathScale = 1;
    let deathOpacityMul = 1;
    if (p.state === EnemyState.DESTROYING) {
      destroyAge.current += dt;
      const u = Math.min(1, destroyAge.current / 0.5);
      deathScale = 1 - u * 0.35;
      deathOpacityMul = 1 - u;
    } else {
      destroyAge.current = 0;
    }

    const scaleBoost = p.isActive
      ? ENEMY_CONFIG.ACTIVE_SCALE_BOOST
      : p.showAsNext
        ? ENEMY_CONFIG.NEXT_SCALE_BOOST
        : 1;
    const finalScale = p.scale * scaleBoost * deathScale;

    root.position.set(displayX, displayY, displayZ);
    root.rotation.set(0, 0, 0);
    root.scale.setScalar(finalScale);

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const opacityBoost = p.isActive
        ? ENEMY_CONFIG.ACTIVE_OPACITY_BOOST
        : p.showAsNext
          ? ENEMY_CONFIG.NEXT_OPACITY_BOOST
          : 0.88;
      const finalOpacity = Math.min(
        1,
        p.opacity * opacityBoost * deathOpacityMul,
      );
      const wrong =
        combatRuntime.wrongFlashEnemyId === id ? combatRuntime.wrongFlash : 0;

      if (wrong > 0.05) {
        mat.color.set("#f43f5e");
        mat.opacity = (0.35 + wrong * 0.45) * finalOpacity;
        glowRef.current.scale.setScalar(1.15 + wrong * 0.4);
      } else {
        mat.color.set(
          p.isActive ? "#fbbf24" : p.showAsNext ? "#a16207" : "#22d3ee",
        );
        mat.opacity =
          p.state === EnemyState.COMPLETED || p.state === EnemyState.DESTROYING
            ? 0.06 * deathOpacityMul
            : (p.isActive ? 0.28 : p.showAsNext ? 0.14 : 0.08) * finalOpacity;
        glowRef.current.scale.setScalar(
          p.isActive ? 1.2 : p.showAsNext ? 1.08 : 1.0,
        );
      }
    }
  });

  if (isCompleted && !isDestroying) {
    return (
      <group
        ref={rootRef}
        position={[
          position.x + visualOffset.x,
          position.y + visualOffset.y,
          position.z + visualOffset.z,
        ]}
      />
    );
  }

  if (isDestroying) {
    return (
      <group
        ref={rootRef}
        position={[
          position.x + visualOffset.x,
          position.y + visualOffset.y,
          position.z + visualOffset.z,
        ]}
      >
        <mesh ref={glowRef} position={[0, 0, 0.01]}>
          <circleGeometry args={[0.45, 20]} />
          <meshBasicMaterial
            color="#f43f5e"
            transparent
            opacity={0.2}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    );
  }

  const opacityBoost = isActive
    ? ENEMY_CONFIG.ACTIVE_OPACITY_BOOST
    : showAsNext
      ? ENEMY_CONFIG.NEXT_OPACITY_BOOST
      : 0.88;
  const finalOpacity = Math.min(1, opacity * opacityBoost);

  const wrong =
    combatRuntime.wrongFlashEnemyId === id && combatRuntime.wrongFlash > 0.08;
  const tone: PiranhaTone = wrong
    ? "wrong"
    : isActive
      ? "active"
      : showAsNext
        ? "next"
        : "default";
  const badge = isActive ? "NOW" : showAsNext ? "NEXT" : null;

  return (
    <group
      ref={rootRef}
      renderOrder={30}
      position={[
        position.x + visualOffset.x,
        position.y + visualOffset.y,
        position.z + visualOffset.z,
      ]}
    >
      {/* Soft aura under the piranha */}
      <mesh ref={glowRef} position={[0, -0.02, 0.0]} renderOrder={29}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial
          color={isActive ? "#fbbf24" : showAsNext ? "#a16207" : "#22d3ee"}
          transparent
          opacity={(isActive ? 0.2 : showAsNext ? 0.1 : 0.07) * finalOpacity}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={fishRef} position={[0, 0, 0.04]} renderOrder={31}>
        {visibleText.length > 0 && (
          <PiranhaLabel
            text={visibleText}
            faceRight={faceRight}
            opacity={showAsNext ? finalOpacity * 0.9 : finalOpacity}
            height={0.78}
            tone={tone}
            badge={badge}
          />
        )}
      </group>

      <group position={[trailX, -0.05, 0]}>
        <EnemyBubbleTrail
          intensity={finalOpacity * (isActive ? 1.15 : showAsNext ? 0.9 : 0.7)}
          reducedMotion={reducedMotion}
        />
      </group>

      <EnemyDebugOverlay
        id={id}
        distanceToCenter={distanceToCenter}
        currentSpeed={currentSpeed}
        state={state}
        positionY={0.62}
        extra={`${progressPercentage}% · ${originalText}${showAsNext ? " · NEXT" : ""}`}
      />
    </group>
  );
}
