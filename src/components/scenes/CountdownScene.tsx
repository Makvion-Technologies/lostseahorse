"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Countdown } from "@/components/game/Countdown";
import { useGameStore } from "@/game/state/useGameStore";
import { GameStatus } from "@/game/types/GameStatus";
import { Button } from "@/components/ui/Button";
import { audioManager } from "@/game/audio/AudioManager";

/**
 * Pre-play countdown. Fades out before gameplay scene mounts.
 */
export function CountdownScene() {
  const restartGame = useGameStore((s) => s.restartGame);
  const setGameStatus = useGameStore((s) => s.setGameStatus);

  const handleComplete = useCallback(() => {
    setGameStatus(GameStatus.PLAYING);
  }, [setGameStatus]);

  const handleCancel = () => {
    audioManager.playUiClick();
    restartGame();
  };

  return (
    <motion.main
      className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#021018]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ocean-gradient pointer-events-none absolute inset-0" />
      <div className="ocean-vignette pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-4">
        <Countdown onComplete={handleComplete} />

        <Button variant="ghost" onClick={handleCancel} className="text-xs">
          Cancel
        </Button>
      </div>
    </motion.main>
  );
}
