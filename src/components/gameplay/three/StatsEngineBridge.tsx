"use client";

import { useStatsEngine } from "@/hooks/useStatsEngine";

/**
 * Mounts inside R3F canvas so stats get useFrame updates.
 */
export function StatsEngineBridge() {
  useStatsEngine();
  return null;
}
