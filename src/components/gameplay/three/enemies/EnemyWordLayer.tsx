"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useEnemyStore } from "@/game/state/useEnemyStore";
import { useGameStore } from "@/game/state/useGameStore";
import { GameStatus } from "@/game/types/GameStatus";
import { typingSystem } from "@/game/systems/TypingSystem";
import { EnemyWord } from "./EnemyWord";

interface EnemyWordLayerProps {
  reducedMotion?: boolean;
  introProgress?: number;
}

/**
 * Bridges simulation → presentation.
 * Marks active (type now) and next (preview) words for the player.
 */
export function EnemyWordLayer({
  reducedMotion = false,
  introProgress = 1,
}: EnemyWordLayerProps) {
  void introProgress;
  const enemies = useEnemyStore((s) => s.enemies);
  const activeEnemyId = useEnemyStore((s) => s.activeEnemyId);
  const initSession = useEnemyStore((s) => s.initSession);
  const resetEnemies = useEnemyStore((s) => s.resetEnemies);
  const tick = useEnemyStore((s) => s.tick);
  const gameStatus = useGameStore((s) => s.gameStatus);

  useEffect(() => {
    initSession();
    return () => {
      resetEnemies();
    };
  }, [initSession, resetEnemies]);

  useFrame((state, delta) => {
    if (gameStatus === GameStatus.PAUSED) return;
    if (
      gameStatus !== GameStatus.PLAYING &&
      gameStatus !== GameStatus.GAME_OVER &&
      gameStatus !== GameStatus.RESULTS
    ) {
      return;
    }
    tick(delta, state.clock.elapsedTime);
  });

  // FIFO next word — pure preview, does not change typing engine
  const nextEnemyId = useMemo(() => {
    const next = typingSystem.selectNextEnemy(enemies, activeEnemyId);
    return next?.id ?? null;
  }, [enemies, activeEnemyId]);

  return (
    <group>
      {enemies.map((enemy) => (
        <EnemyWord
          key={enemy.id}
          id={enemy.id}
          displayText={enemy.remainingText}
          originalText={enemy.originalText}
          position={enemy.position}
          visualOffset={enemy.visualOffset}
          rotation={enemy.rotation}
          scale={enemy.scale}
          opacity={enemy.opacity}
          depth={enemy.depth}
          isActive={enemy.isActive}
          isNext={enemy.id === nextEnemyId}
          state={enemy.state}
          currentSpeed={enemy.currentSpeed}
          distanceToCenter={enemy.distanceToCenter}
          progressPercentage={enemy.progressPercentage}
          reducedMotion={reducedMotion}
          spawnDirection={enemy.spawnDirection}
          velocityX={enemy.velocity.x}
        />
      ))}
    </group>
  );
}
