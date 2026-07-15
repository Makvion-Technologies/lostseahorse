"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { statsSystem } from "@/game/systems/StatsSystem";
import { bindStatsStore } from "@/game/state/useStatsStore";
import { useGameStore } from "@/game/state/useGameStore";
import { GameStatus } from "@/game/types/GameStatus";

/**
 * Lifecycle for the statistics engine inside the R3F tree (frame-accurate WPM).
 * Does not alter combat, spawn, or typing systems.
 */
export function useStatsEngine(): void {
  const gameStatus = useGameStore((s) => s.gameStatus);

  useEffect(() => {
    statsSystem.init();
    const unbind = bindStatsStore();
    return () => {
      unbind();
      statsSystem.dispose();
    };
  }, []);

  useEffect(() => {
    statsSystem.setPaused(gameStatus === GameStatus.PAUSED);
  }, [gameStatus]);

  useFrame((_, delta) => {
    if (gameStatus !== GameStatus.PLAYING) return;
    statsSystem.update(delta);
  });
}
