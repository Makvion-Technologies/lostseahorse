"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CENTER_TARGET, GAMEPLAY_CAMERA } from "@/game/constants/world";
import { GAME_CONFIG } from "@/game/constants/config";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import type { MouseParallax } from "@/hooks/useMouseParallax";

interface GameplayCameraProps {
  mouse: MouseParallax;
  reducedMotion?: boolean;
  /** 0 = intro far shot, 1 = rest pose. */
  introProgress: number;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Fixed framing on world center so left/right seahorse layouts read as
 * true screen-side positions (do not track the seahorse).
 */
export function GameplayCamera({
  mouse,
  reducedMotion = false,
  introProgress,
}: GameplayCameraProps) {
  const lookTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const introRef = useRef(introProgress);
  const mouseRef = useRef(mouse);
  const shakePhase = useRef(0);
  introRef.current = introProgress;
  mouseRef.current = mouse;

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.fov = GAMEPLAY_CAMERA.fov;
    cam.updateProjectionMatrix();

    const intro = smoothstep(0, 1, introRef.current);
    const m = mouseRef.current;
    const rest = GAMEPLAY_CAMERA.position;
    const far = GAMEPLAY_CAMERA.introPosition;

    const go = combatRuntime.gameOverProgress;
    // Always frame world center — seahorse moves within this view
    const baseX = THREE.MathUtils.lerp(far.x, rest.x, intro);
    const baseY = THREE.MathUtils.lerp(far.y, rest.y, intro);
    const baseZ = THREE.MathUtils.lerp(far.z, rest.z, intro);
    const pull = go * GAME_CONFIG.GAME_OVER_CAMERA_PULL;

    let targetX = baseX;
    let targetY = baseY + go * 0.35;
    let targetZ = baseZ + pull;

    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      const idleMul = 1 - go * 0.85;
      const idleX =
        Math.sin(t * 0.18) * GAMEPLAY_CAMERA.idleOrbitStrength * intro * idleMul;
      const idleY =
        Math.sin(t * 0.22) * GAMEPLAY_CAMERA.idleBobStrength * intro * idleMul;
      const parallaxX =
        m.x * GAMEPLAY_CAMERA.parallaxStrength * intro * idleMul;
      const parallaxY =
        m.y * -GAMEPLAY_CAMERA.parallaxStrength * 0.55 * intro * idleMul;

      targetX = baseX + idleX + parallaxX;
      targetY = baseY + idleY + parallaxY + go * 0.35;
      targetZ = baseZ + pull;

      const shake = combatRuntime.cameraShake;
      if (shake > 0) {
        shakePhase.current += Math.min(delta, 0.05) * 40;
        targetX += Math.sin(shakePhase.current * 1.7) * shake * 0.55;
        targetY += Math.cos(shakePhase.current * 2.1) * shake * 0.4;
      }
    }

    if (!initialized.current) {
      cam.position.set(targetX, targetY, targetZ);
      initialized.current = true;
    } else {
      cam.position.x += (targetX - cam.position.x) * 0.035;
      cam.position.y += (targetY - cam.position.y) * 0.035;
      cam.position.z += (targetZ - cam.position.z) * 0.04;
    }

    // Look at world center (not the seahorse) so side layouts stay on screen edges
    lookTarget.current.set(
      CENTER_TARGET.x + m.x * 0.08 * intro,
      CENTER_TARGET.y + m.y * -0.05 * intro,
      CENTER_TARGET.z,
    );
    cam.lookAt(lookTarget.current);
  });

  return null;
}
