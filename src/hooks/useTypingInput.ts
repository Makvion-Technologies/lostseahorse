"use client";

import { useEffect } from "react";
import { useGameStore } from "@/game/state/useGameStore";
import { useEnemyStore } from "@/game/state/useEnemyStore";
import { GameStatus } from "@/game/types/GameStatus";

const IGNORED_KEYS = new Set([
  "Control",
  "Alt",
  "Shift",
  "Meta",
  "Escape",
  "Tab",
  "CapsLock",
  "Enter",
  "Backspace",
  "Delete",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
  "ContextMenu",
  "Dead",
]);

/**
 * Global keyboard capture while PLAYING.
 * No HTML input — keys go straight to TypingSystem via the enemy store.
 */
export function useTypingInput(enabled = true): void {
  const gameStatus = useGameStore((s) => s.gameStatus);

  useEffect(() => {
    if (!enabled) return;
    if (gameStatus !== GameStatus.PLAYING) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Ignore browser shortcuts / modifiers held
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.isComposing) return;

      const { key } = event;
      if (IGNORED_KEYS.has(key)) return;
      if (key.startsWith("F") && key.length <= 3) return; // F1–F12

      // Only feed character keys into the engine; system validates a–z
      if (key.length !== 1) return;

      // Prevent scrolling / focus side-effects for letters
      event.preventDefault();

      useEnemyStore.getState().handleKey(key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, gameStatus]);
}
