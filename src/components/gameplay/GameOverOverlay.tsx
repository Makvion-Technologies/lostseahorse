"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/game/state/useGameStore";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { RESULTS_REVEAL_DELAY_MS } from "@/game/constants/results";
import { GAME_CONFIG } from "@/game/constants/config";
import { getModeById } from "@/game/constants/modes";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Brief end-session beat, then Results overlay.
 * Zen / manual finish uses a calmer, faster handoff.
 */
export function GameOverOverlay() {
  const showResults = useGameStore((s) => s.showResults);
  const gameOverReason = useGameStore((s) => s.gameOverReason);
  const selectedMode = useGameStore((s) => s.selectedMode);
  const [progress, setProgress] = useState(0);
  const reduced = useReducedMotion();
  const isZen = getModeById(selectedMode).id === "zen";
  const isManual = gameOverReason === "manual";

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress(combatRuntime.gameOverProgress);
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    // Zen / practice finish — quick path to stats (no long death cinematic)
    const minWait =
      reduced || isZen || isManual
        ? isZen
          ? 350
          : 500
        : GAME_CONFIG.GAME_OVER_FADE_MS * 0.55 + RESULTS_REVEAL_DELAY_MS;

    const t = window.setTimeout(() => {
      showResults();
    }, minWait);

    return () => window.clearTimeout(t);
  }, [showResults, reduced, isZen, isManual]);

  useEffect(() => {
    if (progress >= 0.92) {
      showResults();
    }
  }, [progress, showResults]);

  const title =
    gameOverReason === "timer"
      ? "Time's Up"
      : isZen || isManual
        ? "Practice Complete"
        : "Game Over";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/30 px-6"
    >
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: reduced || isZen ? 0 : 0.25,
          duration: reduced || isZen ? 0.25 : 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="font-display text-3xl font-medium tracking-[0.18em] text-cyan-50/90 sm:text-4xl md:text-5xl"
      >
        {title}
      </motion.h2>
    </motion.div>
  );
}
