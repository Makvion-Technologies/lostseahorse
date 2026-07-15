"use client";

import { SeahorseProcedural } from "./seahorse/SeahorseProcedural";

export interface SeahorseProps {
  reducedMotion?: boolean;
  introProgress?: number;
  /**
   * Optional GLB path. Only used when a real file is provided.
   * Default is procedural (no network request / no 404 spam).
   */
  modelUrl?: string | null;
}

/**
 * Seahorse centerpiece with animation state machine.
 * Uses the procedural model by default. Drop a file at
 * `/public/models/seahorse.glb` and pass that URL to enable GLB.
 */
export function Seahorse({
  reducedMotion,
  introProgress,
  modelUrl = null,
}: SeahorseProps) {
  // GLB path is opt-in to avoid 404s and failed useGLTF loads in production.
  // When you have a real asset: <Seahorse modelUrl="/models/seahorse.glb" />
  void modelUrl;

  return (
    <SeahorseProcedural
      reducedMotion={reducedMotion}
      introProgress={introProgress}
    />
  );
}
