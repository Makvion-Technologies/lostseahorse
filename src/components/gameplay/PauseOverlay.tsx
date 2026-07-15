"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/game/state/useGameStore";
import { useSettingsStore } from "@/game/state/useSettingsStore";
import { getModeById } from "@/game/constants/modes";
import { audioManager } from "@/game/audio/AudioManager";

/**
 * Pause shell — Resume / Finish (zen) / Restart / Settings / Home.
 */
export function PauseOverlay() {
  const resumeGame = useGameStore((s) => s.resumeGame);
  const restartGame = useGameStore((s) => s.restartGame);
  const restartRound = useGameStore((s) => s.restartRound);
  const endGame = useGameStore((s) => s.endGame);
  const selectedMode = useGameStore((s) => s.selectedMode);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);
  const resumeRef = useRef<HTMLButtonElement>(null);
  const isZen = getModeById(selectedMode).id === "zen";

  useEffect(() => {
    resumeRef.current?.focus();
  }, []);

  const handleResume = () => {
    audioManager.playUiClick();
    resumeGame();
  };

  const handleHome = () => {
    audioManager.playUiClick();
    restartGame();
  };

  const handleRestart = () => {
    audioManager.playUiClick();
    restartRound();
  };

  const handleViewResults = () => {
    audioManager.playUiClick();
    endGame();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/45 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Paused"
    >
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="font-display text-4xl font-medium tracking-[0.2em] text-cyan-50 sm:text-5xl"
        >
          Paused
        </motion.h2>

        <p className="max-w-xs text-xs text-cyan-200/50">
          {isZen
            ? "Esc resume · Finish practice to view your stats"
            : "Esc resume · R restart · keyboard-friendly controls"}
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button
            ref={resumeRef}
            variant="primary"
            onClick={handleResume}
            className="min-w-[10rem]"
          >
            Resume
          </Button>
          {isZen && (
            <Button
              variant="primary"
              onClick={handleViewResults}
              className="min-w-[10rem] !from-amber-400/90 !via-yellow-400/90 !to-amber-500/90"
            >
              View Results
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleRestart}
            className="min-w-[10rem]"
          >
            Restart
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              audioManager.playUiClick();
              setSettingsOpen(true);
            }}
            className="min-w-[10rem]"
          >
            Settings
          </Button>
          <Button variant="ghost" onClick={handleHome} className="min-w-[10rem]">
            Return Home
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
