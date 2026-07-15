"use client";

import type { EnemyState } from "@/game/types/Enemy";
import { useSettingsStore } from "@/game/state/useSettingsStore";
import { WordLabel } from "./WordLabel";

interface EnemyDebugOverlayProps {
  id: string;
  distanceToCenter: number;
  currentSpeed: number;
  state: EnemyState;
  positionY?: number;
  extra?: string;
}

/**
 * Enemy diagnostics — only when Settings → Show Debug is on (dev).
 */
export function EnemyDebugOverlay({
  id,
  distanceToCenter,
  currentSpeed,
  state,
  positionY = 0.4,
  extra,
}: EnemyDebugOverlayProps) {
  const showDebug = useSettingsStore((s) => s.showDebug);

  if (process.env.NODE_ENV === "production" || !showDebug) {
    return null;
  }

  const line = `${state} d${distanceToCenter.toFixed(1)} v${currentSpeed.toFixed(2)}${extra ? ` · ${extra}` : ""} · ${id}`;

  return (
    <group position={[0, positionY, 0.05]}>
      <WordLabel
        text={line.slice(0, 42)}
        color="#94a3b8"
        outlineColor="#020617"
        opacity={0.7}
        height={0.14}
      />
    </group>
  );
}
