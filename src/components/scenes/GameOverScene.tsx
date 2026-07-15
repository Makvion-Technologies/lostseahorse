"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/game/state/useGameStore";
import { GameStatus } from "@/game/types/GameStatus";
import { GAME_CONFIG } from "@/game/constants/config";

/**
 * Brief game-over shell before results.
 * Auto-advances to RESULTS after a short cinematic delay (architecture only).
 */
export function GameOverScene() {
  const setGameStatus = useGameStore((s) => s.setGameStatus);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setGameStatus(GameStatus.RESULTS);
    }, GAME_CONFIG.GAME_OVER_FADE_MS);

    return () => window.clearTimeout(id);
  }, [setGameStatus]);

  return (
    <main className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#021018]">
      <div className="ocean-gradient pointer-events-none absolute inset-0" />
      <div className="ocean-vignette pointer-events-none absolute inset-0" />

      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 font-display text-3xl tracking-[0.2em] text-cyan-50/80 sm:text-4xl"
      >
        Game Over
      </motion.p>
    </main>
  );
}
