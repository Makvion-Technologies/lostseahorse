"use client";

import {
  selectEffectiveReducedMotion,
  useSettingsStore,
} from "@/game/state/useSettingsStore";

/** Combined OS + user reduced-motion preference. */
export function useGameReducedMotion(): boolean {
  return useSettingsStore(selectEffectiveReducedMotion);
}
