import { GAME_CONFIG } from "@/game/constants/config";
import { DEFAULT_MODE_ID, type GameModeId } from "@/game/constants/modes";
import {
  DEFAULT_ARENA_LAYOUT_ID,
  type ArenaLayoutId,
} from "@/game/constants/arena";
import {
  DEFAULT_WORD_PACK_ID,
  type WordPackId,
} from "@/game/data/wordPacks";
import { GameStatus } from "@/game/types/GameStatus";
import type { Word } from "@/game/types/Word";
import type { GameOverReason, GameResults } from "@/game/types/Results";

/**
 * Serializable session fields held in the Zustand store.
 */
export interface GameSessionState {
  gameStatus: GameStatus;
  selectedMode: GameModeId;
  /** Seahorse side: left | center | right — applies to all modes. */
  selectedArenaLayout: ArenaLayoutId;
  /** Active local word pack for spawning. */
  selectedWordPack: WordPackId;
  /** Remaining mode timer (seconds); 0 if no timer. */
  timer: number;
  /** Elapsed play time while PLAYING (seconds). */
  elapsedPlayTime: number;
  score: number;
  combo: number;
  health: number;
  maxHealth: number;
  /** Continuous difficulty multiplier (≥ 1). */
  difficultyMultiplier: number;
  spawnRate: number;
  activeEnemyCount: number;
  currentWPM: number;
  accuracy: number;
  currentWord: string | null;
  activeWordId: string | null;
  spawnedWords: Word[];
  correctCharacters: number;
  incorrectKeystrokes: number;
  wordsDestroyed: number;
  wordsMissed: number;
  longestCombo: number;
  /** Gameplay systems freeze (game over cinematic). */
  systemsFrozen: boolean;
  /** Why the session ended. */
  gameOverReason: GameOverReason | null;
  /** Populated when entering Results — from StatsSystem snapshot. */
  results: GameResults | null;
}

export const createInitialSessionState = (): GameSessionState => ({
  gameStatus: GameStatus.LANDING,
  selectedMode: DEFAULT_MODE_ID,
  selectedArenaLayout: DEFAULT_ARENA_LAYOUT_ID,
  selectedWordPack: DEFAULT_WORD_PACK_ID,
  timer: 0,
  elapsedPlayTime: 0,
  score: 0,
  combo: 0,
  health: GAME_CONFIG.DEFAULT_HEALTH,
  maxHealth: GAME_CONFIG.MAXIMUM_HEALTH,
  difficultyMultiplier: 1,
  spawnRate: 1 / GAME_CONFIG.BASE_SPAWN_INTERVAL,
  activeEnemyCount: 0,
  currentWPM: 0,
  accuracy: 100,
  currentWord: null,
  activeWordId: null,
  spawnedWords: [],
  correctCharacters: 0,
  incorrectKeystrokes: 0,
  wordsDestroyed: 0,
  wordsMissed: 0,
  longestCombo: 0,
  systemsFrozen: false,
  gameOverReason: null,
  results: null,
});
