import { create } from "zustand";
import { getModeById, type GameModeId } from "@/game/constants/modes";
import { GAME_CONFIG } from "@/game/constants/config";
import {
  pickSessionMessage,
  resolvePerformanceTitle,
} from "@/game/constants/results";
import type { WordPackId } from "@/game/data/wordPacks";
import type { ArenaLayoutId } from "@/game/constants/arena";
import { GameStatus } from "@/game/types/GameStatus";
import type { Word } from "@/game/types/Word";
import type { GameOverReason, GameResults } from "@/game/types/Results";
import {
  createInitialSessionState,
  type GameSessionState,
} from "./initialState";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { statsSystem } from "@/game/systems/StatsSystem";
import { spawnSystem } from "@/game/systems/SpawnSystem";
import { audioManager } from "@/game/audio/AudioManager";

export interface GameActions {
  setSelectedMode: (mode: GameModeId) => void;
  setSelectedWordPack: (pack: WordPackId) => void;
  setSelectedArenaLayout: (layout: ArenaLayoutId) => void;
  setGameStatus: (status: GameStatus) => void;

  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  /** Restart with countdown (same mode). */
  restartRound: () => void;
  endGame: () => void;
  /** Health depleted, timer expired, or manual — freeze + GAME_OVER. */
  beginGameOver: (reason?: GameOverReason) => void;
  /** Build results snapshot from StatsSystem and enter RESULTS. */
  showResults: () => void;

  spawnWord: () => void;
  destroyWord: (wordId?: string) => void;
  takeDamage: (amount?: number) => void;
  heal: (amount?: number) => void;
  increaseCombo: () => void;
  resetCombo: () => void;
  updateTimer: (deltaSeconds?: number) => void;
  tickPlayTime: (deltaSeconds: number) => void;
  setDifficultyDebug: (partial: {
    difficultyMultiplier?: number;
    spawnRate?: number;
    activeEnemyCount?: number;
  }) => void;
  calculateResults: () => GameResults | null;
}

export type GameStore = GameSessionState & GameActions;

function buildResultsFromStats(reason: GameOverReason): GameResults {
  const s = statsSystem.getSnapshot();
  const wpm = s.displayWpm > 0 ? s.displayWpm : s.rawWpm;
  const accuracy = s.accuracy;
  const title = resolvePerformanceTitle(wpm, accuracy);
  const seed =
    Math.floor(s.elapsedSeconds * 10) +
    s.correctCharacters +
    s.enemiesDestroyed * 17;

  return {
    wpm,
    peakWpm: s.peakWpm,
    accuracy,
    correctWords: s.correctWords,
    wordsMissed: s.missedWords,
    correctCharacters: s.correctCharacters,
    incorrectKeystrokes: s.incorrectKeystrokes,
    longestCombo: s.highestCombo,
    longestWord: s.longestWord,
    longestWordLength: s.longestWordLength,
    wordsDestroyed: s.enemiesDestroyed,
    averageReactionTime: s.averageReactionTime,
    timePlayed: s.elapsedSeconds,
    performanceTitle: title.title,
    performanceTitleId: title.id,
    sessionMessage: pickSessionMessage(seed),
    gameOverReason: reason,
    defeated: reason === "health",
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialSessionState(),

  setSelectedMode: (mode) => {
    set({ selectedMode: mode });
  },

  setSelectedWordPack: (pack) => {
    set({ selectedWordPack: pack });
    spawnSystem.setWordPack(pack);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lostseahorse.wordPack", pack);
      } catch {
        // ignore
      }
    }
  },

  setSelectedArenaLayout: (layout) => {
    set({ selectedArenaLayout: layout });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lostseahorse.arenaLayout", layout);
      } catch {
        // ignore
      }
    }
  },

  setGameStatus: (status) => {
    set({ gameStatus: status });
  },

  startGame: () => {
    const { selectedMode, selectedWordPack } = get();
    const mode = getModeById(selectedMode);
    spawnSystem.setWordPack(selectedWordPack);

    set({
      gameStatus: GameStatus.COUNTDOWN,
      timer: mode.duration ?? 0,
      elapsedPlayTime: 0,
      score: 0,
      combo: 0,
      health: mode.hasHealth
        ? GAME_CONFIG.DEFAULT_HEALTH
        : GAME_CONFIG.MAXIMUM_HEALTH,
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
    combatRuntime.reset();
  },

  pauseGame: () => {
    const { gameStatus } = get();
    if (gameStatus !== GameStatus.PLAYING) return;
    set({ gameStatus: GameStatus.PAUSED });
  },

  resumeGame: () => {
    const { gameStatus } = get();
    if (gameStatus !== GameStatus.PAUSED) return;
    set({ gameStatus: GameStatus.PLAYING });
  },

  restartGame: () => {
    const { selectedMode, selectedWordPack, selectedArenaLayout } = get();
    combatRuntime.reset();
    set({
      ...createInitialSessionState(),
      selectedMode,
      selectedWordPack,
      selectedArenaLayout,
      gameStatus: GameStatus.LANDING,
    });
  },

  restartRound: () => {
    get().startGame();
  },

  endGame: () => {
    get().beginGameOver("manual");
  },

  beginGameOver: (reason = "manual") => {
    const { gameStatus, health } = get();
    if (
      gameStatus === GameStatus.GAME_OVER ||
      gameStatus === GameStatus.RESULTS
    ) {
      return;
    }

    const defeated = reason === "health";
    set({
      gameStatus: GameStatus.GAME_OVER,
      systemsFrozen: true,
      gameOverReason: reason,
      health: defeated ? 0 : health,
    });
    combatRuntime.beginGameOverCinematic(defeated);
    audioManager.playGameOver();
  },

  showResults: () => {
    const { gameStatus, gameOverReason } = get();
    if (gameStatus === GameStatus.RESULTS) return;
    const reason = gameOverReason ?? "manual";
    const results = buildResultsFromStats(reason);
    set({
      gameStatus: GameStatus.RESULTS,
      systemsFrozen: true,
      results,
    });
    audioManager.playResultsReveal();
  },

  spawnWord: () => {
    // Spawning owned by SpawnSystem via enemy store tick
  },

  destroyWord: (_wordId?: string) => {
    void _wordId;
  },

  takeDamage: (amount = GAME_CONFIG.DAMAGE_PER_MISS) => {
    const { health, selectedMode, gameStatus, systemsFrozen } = get();
    if (systemsFrozen || gameStatus !== GameStatus.PLAYING) return;

    const mode = getModeById(selectedMode);
    if (!mode.hasHealth) return;

    const next = Math.max(0, health - amount);
    set({ health: next });
    combatRuntime.onSeahorseHit();
    audioManager.playDamage();

    if (next <= 0) {
      get().beginGameOver("health");
    }
  },

  heal: (amount = 1) => {
    const { health, maxHealth } = get();
    set({ health: Math.min(maxHealth, health + amount) });
  },

  increaseCombo: () => {
    set((s) => {
      const combo = s.combo + 1;
      return {
        combo,
        longestCombo: Math.max(s.longestCombo, combo),
      };
    });
  },

  resetCombo: () => {
    set({ combo: 0 });
  },

  updateTimer: (deltaSeconds = 0) => {
    const { selectedMode, timer, gameStatus, systemsFrozen } = get();
    if (gameStatus !== GameStatus.PLAYING || systemsFrozen) return;
    const mode = getModeById(selectedMode);
    if (!mode.hasTimer) return;

    const next = Math.max(0, timer - deltaSeconds);
    set({ timer: next });
    if (next <= 0) {
      get().beginGameOver("timer");
    }
  },

  tickPlayTime: (deltaSeconds) => {
    const { gameStatus, systemsFrozen, elapsedPlayTime } = get();
    if (gameStatus !== GameStatus.PLAYING || systemsFrozen) return;
    set({ elapsedPlayTime: elapsedPlayTime + deltaSeconds });
  },

  setDifficultyDebug: (partial) => {
    set(partial);
  },

  calculateResults: () => {
    const reason = get().gameOverReason ?? "manual";
    return buildResultsFromStats(reason);
  },
}));

export const selectGameStatus = (s: GameStore) => s.gameStatus;
export const selectSelectedMode = (s: GameStore) => s.selectedMode;
export const selectSpawnedWords = (s: GameStore): Word[] => s.spawnedWords;
