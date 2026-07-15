"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { CENTER_TARGET, SPAWN_RING_RADIUS } from "@/game/constants/world";
import { useSettingsStore } from "@/game/state/useSettingsStore";

/**
 * Spawn radius ring — only when Settings → Show Debug is on (dev).
 */
export function SpawnRingDebug() {
  const showDebug = useSettingsStore((s) => s.showDebug);

  const geometry = useMemo(
    () =>
      new THREE.RingGeometry(SPAWN_RING_RADIUS - 0.03, SPAWN_RING_RADIUS, 64),
    [],
  );

  if (process.env.NODE_ENV === "production" || !showDebug) return null;

  return (
    <mesh
      geometry={geometry}
      position={[CENTER_TARGET.x, CENTER_TARGET.y, CENTER_TARGET.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshBasicMaterial
        color="#22d3ee"
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
