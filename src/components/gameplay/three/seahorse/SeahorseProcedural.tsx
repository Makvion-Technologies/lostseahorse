"use client";

/**
 * Polished procedural seahorse with animation state machine.
 * Used when a GLB is unavailable; same combat hooks as the GLB path.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HEALTH_CLEARANCE_RADIUS } from "@/game/constants/world";
import { getArenaTarget } from "@/game/constants/arena";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { useGameStore } from "@/game/state/useGameStore";
import { SeahorseAnimationStateMachine } from "./animationStateMachine";

interface SeahorseProceduralProps {
  reducedMotion?: boolean;
  introProgress?: number;
}

export function SeahorseProcedural({
  reducedMotion = false,
  introProgress = 1,
}: SeahorseProceduralProps) {
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const layout = useGameStore((s) => s.selectedArenaLayout);
  const arenaTarget = useMemo(() => getArenaTarget(layout), [layout]);
  const healthRatio = maxHealth > 0 ? health / maxHealth : 1;

  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const snoutRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const finRef = useRef<THREE.Mesh>(null);
  const introRef = useRef(introProgress);
  introRef.current = introProgress;

  const fsm = useMemo(() => new SeahorseAnimationStateMachine(), []);
  const smoothYaw = useRef(0);
  const smoothPitch = useRef(0);
  const prevHit = useRef(0);
  const prevAttack = useRef(0);

  // Brighter materials so the seahorse reads clearly without HDR env maps
  const coreMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#14b8a6"),
        emissive: new THREE.Color("#2dd4bf"),
        emissiveIntensity: 0.85,
        metalness: 0.25,
        roughness: 0.35,
      }),
    [],
  );
  const accentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#99f6e4"),
        emissive: new THREE.Color("#5eead4"),
        emissiveIntensity: 0.65,
        metalness: 0.3,
        roughness: 0.28,
        transparent: true,
        opacity: 0.95,
      }),
    [],
  );
  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#67e8f9"),
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state, delta) => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const head = headRef.current;
    if (!root || !body) return;

    const t = state.clock.elapsedTime;
    const p = introRef.current;
    const combat = combatRuntime.seahorse;
    const goRaw = combatRuntime.gameOverProgress;
    const defeated = combatRuntime.gameOverDefeated;
    const go = defeated ? goRaw : goRaw * 0.15;
    const hr = healthRatio;
    const hit = combatRuntime.hitFlash;

    if (defeated && goRaw > 0.02) {
      fsm.request("death");
    } else if (hit > 0.55 && prevHit.current <= 0.55) {
      fsm.request("hurt");
    } else if (combat.attackTimer > 0.05 && prevAttack.current <= 0.05) {
      fsm.request("attack");
    } else {
      fsm.request("idle");
    }
    prevHit.current = hit;
    prevAttack.current = combat.attackTimer;

    const w = fsm.update(delta);

    // Blended pose parameters (never snap)
    const breatheRate =
      1.4 * w.idle + 2.2 * w.attack + 2.8 * w.hurt + 0.6 * w.death;
    const breatheAmp =
      0.035 * w.idle + 0.02 * w.attack + 0.05 * w.hurt + 0.01 * w.death;
    const floatAmp =
      0.12 * w.idle + 0.06 * w.attack + 0.04 * w.hurt + 0.02 * w.death;
    const glowBase =
      (hr > 0.7 ? 0.45 : hr > 0.4 ? 0.32 : hr > 0.2 ? 0.18 : 0.08) *
      (1 - w.death * 0.7);
    const droop =
      (hr > 0.2 ? 0 : 0.12 + (0.2 - hr) * 0.4) + w.death * 0.55 + w.hurt * 0.12;

    if (reducedMotion) {
      root.position.set(
        arenaTarget.x,
        arenaTarget.y - go * 1.8,
        arenaTarget.z,
      );
      root.rotation.set(droop, 0, 0);
      body.scale.setScalar(1);
      return;
    }

    const floatY = Math.sin(t * 0.7) * floatAmp;
    const breathe = 1 + Math.sin(t * breatheRate) * breatheAmp;
    const idleTilt = Math.sin(t * 0.45) * 0.08 * w.idle;
    const idleYaw = t * 0.28 * w.idle * (0.4 + hr * 0.6);
    const attackLunge = w.attack * (0.08 + Math.sin(t * 30) * 0.02);
    const hurtShake = w.hurt * Math.sin(t * 22) * 0.1;
    const deathCurl = w.death * Math.sin(t * 0.8) * 0.15;

    const sinkY = go * 2.2;
    const sinkFade = 1 - go * 0.85;

    const aimBlend = combat.aimBlend * (1 - go) * (1 - w.death);
    const dx = combat.aimX - arenaTarget.x;
    const dy = combat.aimY - arenaTarget.y;
    const targetYaw = Math.atan2(dx, 1.2) * aimBlend;
    const targetPitch = Math.atan2(dy, 2.2) * aimBlend * 0.5;

    smoothYaw.current += (targetYaw - smoothYaw.current) * 0.18;
    smoothPitch.current += (targetPitch - smoothPitch.current) * 0.14;

    const bodyYaw =
      idleYaw * (1 - aimBlend * 0.85) +
      smoothYaw.current * 0.55 +
      hurtShake +
      deathCurl;
    const headYaw = smoothYaw.current * 1.15 + w.attack * 0.1;
    const headPitch = smoothPitch.current - w.attack * 0.15 + w.hurt * 0.2;

    root.position.set(
      arenaTarget.x + attackLunge,
      arenaTarget.y + floatY - sinkY - droop * 0.25,
      arenaTarget.z,
    );
    root.rotation.set(
      idleTilt * 0.4 + headPitch * 0.25 + droop + go * 0.5,
      bodyYaw,
      idleTilt + hurtShake * 0.5,
    );

    if (head) {
      head.rotation.set(headPitch * 0.6 + droop * 0.3, headYaw * 0.45, 0);
      head.position.x = w.attack * 0.04;
    }

    const mouth = Math.max(combat.mouthOpen, w.attack * 0.85);
    if (snoutRef.current) {
      snoutRef.current.scale.set(
        1 + mouth * 0.15,
        1 + mouth * 0.35,
        1 + mouth * 0.2,
      );
      snoutRef.current.position.x = 0.32 + mouth * 0.06;
    }

    body.scale.set(
      breathe * (1 + w.attack * 0.04),
      breathe * (1 + Math.sin(t * 1.1) * 0.02) * (1 - w.death * 0.1),
      breathe,
    );

    if (tailRef.current) {
      const tailSpeed = 1.8 * w.idle + 3.5 * w.attack + 0.5 * w.death;
      const tailAmp = 0.35 * w.idle + 0.5 * w.attack + 0.1 * w.death;
      tailRef.current.rotation.z = Math.sin(t * tailSpeed) * tailAmp + w.death * 0.4;
      tailRef.current.rotation.y = Math.sin(t * 1.2) * 0.12;
    }

    if (finRef.current) {
      finRef.current.rotation.z =
        Math.sin(t * (2.2 + w.attack * 4)) * (0.25 + w.attack * 0.2);
    }

    coreMat.emissiveIntensity =
      (glowBase +
        p * 0.15 +
        Math.sin(t * 1.5) * 0.04 +
        combat.glowBoost * 0.85 +
        hit * 0.5 +
        w.attack * 0.25) *
      sinkFade;
    glowMat.opacity =
      (0.04 + glowBase * 0.12 + p * 0.06 + combat.glowBoost * 0.18 + hit * 0.15) *
      sinkFade *
      (1 - w.death * 0.6);
  });

  return (
    <group
      ref={rootRef}
      position={[arenaTarget.x, arenaTarget.y, arenaTarget.z]}
    >
      <mesh scale={1.55} material={glowMat}>
        <sphereGeometry args={[1, 24, 24]} />
      </mesh>

      <group ref={bodyRef}>
        {/* Torso */}
        <mesh castShadow receiveShadow material={coreMat} position={[0, 0.05, 0]}>
          <capsuleGeometry args={[0.3, 0.78, 10, 20]} />
        </mesh>

        {/* Belly plate */}
        <mesh
          material={accentMat}
          position={[0.1, 0.02, 0.18]}
          scale={[0.42, 0.72, 0.32]}
        >
          <sphereGeometry args={[0.28, 16, 16]} />
        </mesh>

        {/* Head */}
        <group ref={headRef}>
          <mesh
            castShadow
            material={coreMat}
            position={[0.1, 0.68, 0.04]}
            rotation={[0, 0, -0.4]}
            scale={[0.9, 0.78, 0.88]}
          >
            <sphereGeometry args={[0.27, 24, 24]} />
          </mesh>

          {/* Crown ridges */}
          <mesh
            material={accentMat}
            position={[0.02, 0.92, 0]}
            rotation={[0, 0, -0.2]}
            scale={[0.12, 0.28, 0.08]}
          >
            <sphereGeometry args={[0.35, 10, 10]} />
          </mesh>
          <mesh
            material={accentMat}
            position={[-0.06, 0.88, 0.02]}
            rotation={[0, 0, 0.15]}
            scale={[0.1, 0.22, 0.07]}
          >
            <sphereGeometry args={[0.35, 10, 10]} />
          </mesh>

          {/* Eye */}
          <mesh position={[0.28, 0.72, 0.14]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial
              color="#ecfeff"
              emissive="#67e8f9"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={[0.32, 0.73, 0.17]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshBasicMaterial color="#042f2e" />
          </mesh>

          {/* Snout */}
          <mesh
            ref={snoutRef}
            castShadow
            material={accentMat}
            position={[0.32, 0.6, 0.05]}
            rotation={[0, 0, -0.12]}
          >
            <capsuleGeometry args={[0.055, 0.28, 6, 12]} />
          </mesh>
        </group>

        {/* Dorsal fin */}
        <mesh
          ref={finRef}
          material={accentMat}
          position={[-0.2, 0.12, 0]}
          rotation={[0, 0, 0.25]}
          scale={[0.14, 0.58, 0.1]}
        >
          <sphereGeometry args={[0.4, 12, 12]} />
        </mesh>

        {/* Curled tail */}
        <mesh
          ref={tailRef}
          castShadow
          material={coreMat}
          position={[-0.02, -0.58, 0.04]}
          rotation={[0.45, 0, 0.95]}
        >
          <capsuleGeometry args={[0.11, 0.48, 8, 14]} />
        </mesh>
        <mesh
          material={accentMat}
          position={[-0.26, -0.82, 0.08]}
          rotation={[0.65, 0.25, 1.25]}
          scale={0.72}
        >
          <capsuleGeometry args={[0.07, 0.26, 6, 12]} />
        </mesh>
        <mesh
          material={coreMat}
          position={[-0.38, -0.92, 0.12]}
          rotation={[0.9, 0.4, 1.5]}
          scale={0.5}
        >
          <capsuleGeometry args={[0.06, 0.18, 6, 10]} />
        </mesh>
      </group>

      <group position={[0, HEALTH_CLEARANCE_RADIUS * 0.15, 0]} visible={false}>
        <mesh>
          <ringGeometry
            args={[
              HEALTH_CLEARANCE_RADIUS * 0.9,
              HEALTH_CLEARANCE_RADIUS,
              16,
            ]}
          />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </group>
  );
}
