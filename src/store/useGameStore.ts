/**
 * Compatibility re-export.
 * Canonical store lives under @/game/state.
 */
export {
  useGameStore,
  selectGameStatus,
  selectSelectedMode,
  selectSpawnedWords,
  type GameStore,
  type GameActions,
} from "@/game/state/useGameStore";
