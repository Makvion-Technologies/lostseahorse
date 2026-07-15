"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { CENTER_TARGET, HEALTH_CLEARANCE_RADIUS } from "@/game/constants/world";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { useGameStore } from "@/game/state/useGameStore";
import {
  SeahorseAnimationStateMachine,
  type SeahorseAnimState,
} from "./animationStateMachine";

/** Public path for optional authored GLB with named clips. */
export const SEAHORSE_MODEL_URL = "/models/seahorse.glb";

const CLIP_ALIASES: Record<SeahorseAnimState, string[]> = {
  idle: ["idle", "Idle", "IDLE", "Swim", "swim"],
  attack: ["attack", "Attack", "ATTACK", "Shoot", "shoot"],
  hurt: ["hurt", "Hurt", "HURT", "Hit", "hit", "Damage"],
  death: ["death", "Death", "DEATH", "Die", "die"],
};

function resolveClip(
  actions: Record<string, THREE.AnimationAction | null>,
  state: SeahorseAnimState,
): THREE.AnimationAction | null {
  for (const name of CLIP_ALIASES[state]) {
    if (actions[name]) return actions[name];
  }
  // Fallback: first action for idle only
  if (state === "idle") {
    const first = Object.values(actions)[0];
    return first ?? null;
  }
  return null;
}

interface SeahorseModelProps {
  reducedMotion?: boolean;
  introProgress?: number;
  url?: string;
}

/**
 * GLB seahorse with animation state machine.
 * Smoothly cross-fades clips; falls back to idle if a clip is missing.
 */
export function SeahorseModel({
  reducedMotion = false,
  introProgress = 1,
  url = SEAHORSE_MODEL_URL,
}: SeahorseModelProps) {
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const healthRatio = maxHealth > 0 ? health / maxHealth : 1;

  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions, mixer } = useAnimations(animations, group);
  const fsm = useMemo(() => new SeahorseAnimationStateMachine(), []);
  const introRef = useRef(introProgress);
  introRef.current = introProgress;

  const cloned = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
        }
      }
    });
    return root;
  }, [scene]);

  const smoothYaw = useRef(0);
  const smoothPitch = useRef(0);
  const prevHit = useRef(0);
  const prevAttack = useRef(0);

  // Prepare actions
  useEffect(() => {
    fsm.reset();
    const idle = resolveClip(actions, "idle");
    if (idle) {
      idle.reset().fadeIn(0.4).play();
      idle.setEffectiveWeight(1);
    }
    for (const state of ["attack", "hurt", "death"] as SeahorseAnimState[]) {
      const action = resolveClip(actions, state);
      if (action) {
        action.enabled = true;
        action.setEffectiveWeight(0);
        action.play();
        if (state === "death") {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
      }
    }
    return () => {
      mixer?.stopAllAction();
    };
  }, [actions, mixer, fsm]);

  useFrame((state, delta) => {
    const root = group.current;
    if (!root) return;

    const t = state.clock.elapsedTime;
    const p = introRef.current;
    const combat = combatRuntime.seahorse;
    const goRaw = combatRuntime.gameOverProgress;
    const defeated = combatRuntime.gameOverDefeated;
    const go = defeated ? goRaw : goRaw * 0.15;
    const hr = healthRatio;
    const hit = combatRuntime.hitFlash;

    // Drive state machine from combat signals
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

    const weights = fsm.update(delta);

    // Apply animation weights with smooth blending
    for (const animState of Object.keys(weights) as SeahorseAnimState[]) {
      const action = resolveClip(actions, animState);
      if (!action) continue;
      const w = weights[animState];
      action.setEffectiveWeight(w);
      if (w > 0.01 && !action.isRunning()) {
        action.play();
      }
    }

    if (mixer) mixer.update(0); // drei already updates; ensure weight sync

    // Procedural secondary motion on root (aim / float / sink)
    const floatAmp = hr > 0.7 ? 0.1 : hr > 0.4 ? 0.08 : 0.05;
    const droop = hr > 0.2 ? 0 : 0.12 + (0.2 - hr) * 0.4;

    if (reducedMotion) {
      root.position.set(
        CENTER_TARGET.x,
        CENTER_TARGET.y - go * 1.8,
        CENTER_TARGET.z,
      );
      root.rotation.set(droop, Math.PI * 0.5, 0);
      root.scale.setScalar(0.85 + p * 0.15);
      return;
    }

    const floatY = Math.sin(t * 0.7) * floatAmp * (1 - weights.death);
    const sinkY = go * 2.2;
    const aimBlend = combat.aimBlend * (1 - go);
    const dx = combat.aimX - CENTER_TARGET.x;
    const dy = combat.aimY - CENTER_TARGET.y;
    const targetYaw = Math.atan2(dx, 1.2) * aimBlend;
    const targetPitch = Math.atan2(dy, 2.2) * aimBlend * 0.5;

    smoothYaw.current += (targetYaw - smoothYaw.current) * 0.18;
    smoothPitch.current += (targetPitch - smoothPitch.current) * 0.14;

    const idleYaw = t * 0.2 * (1 - aimBlend) * (1 - weights.death);
    const hurtKick = weights.hurt * Math.sin(t * 18) * 0.08;
    const attackLunge = weights.attack * 0.06;

    root.position.set(
      CENTER_TARGET.x + attackLunge * Math.cos(smoothYaw.current),
      CENTER_TARGET.y + floatY - sinkY - droop * 0.25 + weights.hurt * 0.04,
      CENTER_TARGET.z,
    );
    root.rotation.set(
      0.15 + smoothPitch.current * 0.4 + droop + go * 0.5 + hurtKick,
      Math.PI * 0.5 + idleYaw + smoothYaw.current * 0.55,
      idleYaw * 0.15 + weights.attack * 0.05,
    );

    const scale =
      (0.85 + p * 0.15) *
      (1 + weights.attack * 0.04) *
      (1 - weights.death * 0.08);
    root.scale.setScalar(scale);

    // Emissive pulse on materials when attacking / hurt
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && "emissiveIntensity" in mat) {
        const base = 0.2 + hr * 0.35;
        mat.emissiveIntensity =
          (base + combat.glowBoost * 0.8 + hit * 0.5) * (1 - go * 0.7);
      }
    });
  });

  return (
    <group ref={group} position={[CENTER_TARGET.x, CENTER_TARGET.y, CENTER_TARGET.z]}>
      <primitive object={cloned} />
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


