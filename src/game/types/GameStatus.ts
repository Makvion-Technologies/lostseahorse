/**
 * High-level application / session lifecycle.
 * All future gameplay and scene routing use these states.
 */
export enum GameStatus {
  LANDING = "LANDING",
  COUNTDOWN = "COUNTDOWN",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAME_OVER = "GAME_OVER",
  RESULTS = "RESULTS",
}

/** Intended scene flow (architecture only — not fully driven yet). */
export const GAME_STATUS_FLOW: readonly GameStatus[] = [
  GameStatus.LANDING,
  GameStatus.COUNTDOWN,
  GameStatus.PLAYING,
  GameStatus.GAME_OVER,
  GameStatus.RESULTS,
] as const;
