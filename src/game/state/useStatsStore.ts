import { create } from "zustand";
import { statsSystem } from "@/game/systems/StatsSystem";
import {
  createEmptyStats,
  type SessionStats,
} from "@/game/stats/types";

/**
 * React-facing mirror of StatsSystem for HUD selectors.
 * Updated only when stats change — not every three.js frame for unrelated state.
 */
interface StatsStore extends SessionStats {
  /** Sync from StatsSystem snapshot */
  pull: () => void;
  reset: () => void;
}

export const useStatsStore = create<StatsStore>((set) => ({
  ...createEmptyStats(),

  pull: () => {
    const s = statsSystem.getSnapshot();
    set({ ...s });
  },

  reset: () => {
    set({ ...createEmptyStats() });
  },
}));

/** Bind StatsSystem → store once. */
let bound = false;
export function bindStatsStore(): () => void {
  if (bound) {
    return () => undefined;
  }
  bound = true;
  const unsub = statsSystem.subscribe(() => {
    useStatsStore.getState().pull();
  });
  useStatsStore.getState().pull();
  return () => {
    unsub();
    bound = false;
  };
}
