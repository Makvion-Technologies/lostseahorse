import { GAME_CONFIG } from "@/game/constants/config";

export interface DifficultySnapshot {
  /** Continuous multiplier starting at 1.0 */
  multiplier: number;
  /** Desired living enemies on screen */
  targetActive: number;
  /** Seconds between spawn attempts */
  spawnInterval: number;
  /** Multiplier on enemy base swim speed */
  speedMul: number;
  /** Preferred min/max word lengths */
  wordLengthMin: number;
  wordLengthMax: number;
}

/**
 * Continuous difficulty curve from elapsed play time (no discrete levels).
 */
export function getDifficulty(elapsedSeconds: number): DifficultySnapshot {
  const t = Math.max(0, elapsedSeconds);
  const ramp = GAME_CONFIG.DIFFICULTY_RAMP_SECONDS;

  // Smooth ease toward cap: 1 → MAX
  const raw = 1 + t / ramp;
  const multiplier = Math.min(
    GAME_CONFIG.MAX_DIFFICULTY_MULTIPLIER,
    raw,
  );

  const progress = (multiplier - 1) / (GAME_CONFIG.MAX_DIFFICULTY_MULTIPLIER - 1);

  const targetActive = Math.round(
    GAME_CONFIG.BASE_ACTIVE_ENEMIES +
      progress *
        (GAME_CONFIG.MAX_ACTIVE_ENEMIES - GAME_CONFIG.BASE_ACTIVE_ENEMIES),
  );

  const spawnInterval = Math.max(
    GAME_CONFIG.MIN_SPAWN_INTERVAL,
    GAME_CONFIG.BASE_SPAWN_INTERVAL - progress * 1.2,
  );

  const speedMul = 1 + progress * 0.85;

  const wordLengthMin = GAME_CONFIG.BASE_WORD_LENGTH_MIN;
  const wordLengthMax = Math.min(
    12,
    Math.round(
      GAME_CONFIG.BASE_WORD_LENGTH_MAX + progress * 3,
    ),
  );

  return {
    multiplier,
    targetActive: Math.max(3, targetActive),
    spawnInterval,
    speedMul,
    wordLengthMin,
    wordLengthMax,
  };
}
