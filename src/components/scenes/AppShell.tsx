"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LandingScreen } from "@/components/landing/LandingScreen";
import { CountdownScene } from "@/components/scenes/CountdownScene";
import { GameplayScene } from "@/components/scenes/GameplayScene";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { useGameStore } from "@/game/state/useGameStore";
import { GameStatus } from "@/game/types/GameStatus";
import { selectEffectiveReducedMotion, useSettingsStore } from "@/game/state/useSettingsStore";
import { useGameShortcuts } from "@/hooks/useGameShortcuts";

/**
 * Top-level scene router.
 * GAME_OVER and RESULTS stay on GameplayScene so the ocean never remounts.
 */
export function AppShell() {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const reducedMotion = useSettingsStore(selectEffectiveReducedMotion);
  useGameShortcuts();

  const showGameplay =
    gameStatus === GameStatus.PLAYING ||
    gameStatus === GameStatus.PAUSED ||
    gameStatus === GameStatus.GAME_OVER ||
    gameStatus === GameStatus.RESULTS;

  const fade = reducedMotion ? 0.05 : 0.45;
  const exitLong = reducedMotion ? 0.1 : 0.65;

  return (
    <div className="ui-scale-root relative h-dvh w-full overflow-hidden bg-[#021018]">
      <AnimatePresence mode="wait">
        {gameStatus === GameStatus.LANDING && (
          <motion.div
            key="landing"
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: fade }}
          >
            <LandingScreen />
          </motion.div>
        )}

        {gameStatus === GameStatus.COUNTDOWN && (
          <motion.div
            key="countdown"
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: exitLong, ease: [0.22, 1, 0.36, 1] }}
          >
            <CountdownScene />
          </motion.div>
        )}

        {showGameplay && (
          <motion.div
            key="gameplay"
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0.15 : 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <GameplayScene />
          </motion.div>
        )}
      </AnimatePresence>

      <DebugPanel />
    </div>
  );
}
