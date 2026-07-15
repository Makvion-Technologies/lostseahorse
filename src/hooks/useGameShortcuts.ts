"use client";

import { useEffect } from "react";
import { useGameStore } from "@/game/state/useGameStore";
import { useSettingsStore } from "@/game/state/useSettingsStore";
import { GameStatus } from "@/game/types/GameStatus";
import { audioManager } from "@/game/audio/AudioManager";

/**
 * Global keyboard shortcuts that never interfere with typing a–z.
 * Esc: pause / resume / close settings
 * M: mute toggle (landing / paused only)
 * R: restart round when paused
 */
export function useGameShortcuts(): void {
  const gameStatus = useGameStore((s) => s.gameStatus);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const restartRound = useGameStore((s) => s.restartRound);
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);
  const toggleMute = useSettingsStore((s) => s.toggleMute);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      // Close settings first
      if (event.key === "Escape" && settingsOpen) {
        event.preventDefault();
        setSettingsOpen(false);
        return;
      }

      if (event.key === "Escape") {
        if (gameStatus === GameStatus.PLAYING) {
          event.preventDefault();
          audioManager.playUiClick();
          pauseGame();
          return;
        }
        if (gameStatus === GameStatus.PAUSED) {
          event.preventDefault();
          audioManager.playUiClick();
          resumeGame();
          return;
        }
      }

      // Mute on landing / paused / results (not during PLAYING — letters own keys)
      if (
        (event.key === "m" || event.key === "M") &&
        (gameStatus === GameStatus.LANDING ||
          gameStatus === GameStatus.PAUSED ||
          gameStatus === GameStatus.RESULTS ||
          gameStatus === GameStatus.COUNTDOWN)
      ) {
        event.preventDefault();
        toggleMute();
        return;
      }

      if (
        (event.key === "r" || event.key === "R") &&
        gameStatus === GameStatus.PAUSED
      ) {
        event.preventDefault();
        audioManager.playUiClick();
        restartRound();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    gameStatus,
    pauseGame,
    resumeGame,
    restartRound,
    settingsOpen,
    setSettingsOpen,
    toggleMute,
  ]);
}
