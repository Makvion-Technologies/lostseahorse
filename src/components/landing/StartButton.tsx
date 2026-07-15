"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/game/state/useGameStore";
import { audioManager } from "@/game/audio/AudioManager";

export function StartButton() {
  const startGame = useGameStore((s) => s.startGame);

  const handleStart = () => {
    void audioManager.unlock();
    audioManager.playUiClick();
    startGame();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10"
    >
      <Button
        variant="primary"
        onClick={handleStart}
        className="min-w-[12rem] px-12 py-4 text-base tracking-[0.12em] uppercase"
      >
        Start
      </Button>
    </motion.div>
  );
}
