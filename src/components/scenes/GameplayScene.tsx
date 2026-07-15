"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { HudSlots } from "@/components/gameplay/HudSlots";
import { PauseOverlay } from "@/components/gameplay/PauseOverlay";
import { GameOverOverlay } from "@/components/gameplay/GameOverOverlay";
import { ResultsOverlay } from "@/components/gameplay/results/ResultsOverlay";
import { useGameStore } from "@/game/state/useGameStore";
import { GameStatus } from "@/game/types/GameStatus";
import { audioManager } from "@/game/audio/AudioManager";
import { useTypingInput } from "@/hooks/useTypingInput";

const GameplayCanvas = dynamic(
  () => import("@/components/gameplay/three/GameplayCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#021018]" aria-hidden />
    ),
  },
);

/**
 * Full-screen gameplay world.
 * RESULTS overlays the still-running ocean scene (no remount).
 *
 * Important: never apply CSS `filter` to the WebGL canvas parent —
 * that causes WebGL context loss and blank grey/white screens.
 */
export function GameplayScene() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const isPaused = gameStatus === GameStatus.PAUSED;
  const isGameOver = gameStatus === GameStatus.GAME_OVER;
  const isResults = gameStatus === GameStatus.RESULTS;
  const ended = isGameOver || isResults;

  useTypingInput(!ended);

  useEffect(() => {
    audioManager.init();
    audioManager.playAmbient();
  }, []);

  return (
    <main className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#021018]">
      <div className="gameplay-ocean-gradient pointer-events-none absolute inset-0 -z-10" />

      <div className="absolute inset-0">
        <GameplayCanvas />
      </div>

      <div className="gameplay-vignette pointer-events-none absolute inset-0 z-10" />

      {isPaused && (
        <div
          className="pointer-events-none absolute inset-0 z-[15] bg-slate-950/35"
          aria-hidden
        />
      )}
      {isGameOver && !isResults && (
        <div
          className="pointer-events-none absolute inset-0 z-[15] bg-slate-950/25"
          aria-hidden
        />
      )}
      {isResults && (
        <div
          className="pointer-events-none absolute inset-0 z-[15] bg-slate-950/40"
          aria-hidden
        />
      )}

      <div className="ui-scale-chrome pointer-events-none absolute inset-0 z-20">
        {!ended && (
          <div className="pointer-events-none absolute inset-0">
            <HudSlots />
          </div>
        )}
      </div>

      {isPaused && <PauseOverlay />}
      {isGameOver && <GameOverOverlay />}
      {isResults && <ResultsOverlay />}
    </main>
  );
}
