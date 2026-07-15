"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  CENTER_TARGET,
  SPAWN_DIRECTION_VECTORS,
  SPAWN_DIRECTIONS,
  SPAWN_RING_RADIUS,
} from "@/game/constants/world";
import { useSettingsStore } from "@/game/state/useSettingsStore";

/**
 * Guide lines from spawn edges — only when Settings → Show Debug is on (dev).
 */
export function IncomingPathsDebug() {
  const showDebug = useSettingsStore((s) => s.showDebug);

  const lineObjects = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color: "#67e8f9",
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });

    return SPAWN_DIRECTIONS.map((dir) => {
      const v = SPAWN_DIRECTION_VECTORS[dir];
      const points = [
        new THREE.Vector3(
          CENTER_TARGET.x + v.x * SPAWN_RING_RADIUS,
          CENTER_TARGET.y + v.y * SPAWN_RING_RADIUS,
          CENTER_TARGET.z,
        ),
        new THREE.Vector3(CENTER_TARGET.x, CENTER_TARGET.y, CENTER_TARGET.z),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return new THREE.Line(geometry, material);
    });
  }, []);

  if (process.env.NODE_ENV === "production" || !showDebug) return null;

  return (
    <group>
      {lineObjects.map((line, index) => (
        <primitive key={SPAWN_DIRECTIONS[index]} object={line} />
      ))}
    </group>
  );
}
