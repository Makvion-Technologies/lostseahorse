/**
 * Placeholder gameplay event names.
 * No event bus is wired in Phase 2 — types only for future phases.
 */
export enum GameEventType {
  LETTER_TYPED = "LETTER_TYPED",
  LETTER_INCORRECT = "LETTER_INCORRECT",
  WORD_COMPLETED = "WORD_COMPLETED",
  WORD_DESTROYED = "WORD_DESTROYED",
  WORD_MISSED = "WORD_MISSED",
  ACTIVE_ENEMY_CHANGED = "ACTIVE_ENEMY_CHANGED",
  GAME_STARTED = "GAME_STARTED",
  GAME_ENDED = "GAME_ENDED",
  COUNTDOWN_FINISHED = "COUNTDOWN_FINISHED",
  COMBO_INCREASED = "COMBO_INCREASED",
  COMBO_RESET = "COMBO_RESET",
  DAMAGE_TAKEN = "DAMAGE_TAKEN",
  HEALTH_CHANGED = "HEALTH_CHANGED",
  MODE_SELECTED = "MODE_SELECTED",
  GAME_PAUSED = "GAME_PAUSED",
  GAME_RESUMED = "GAME_RESUMED",
}

/** Payload shapes reserved for a future event system / combat subscribers. */
export interface GameEventMap {
  [GameEventType.LETTER_TYPED]: {
    letter: string;
    wordId: string;
    typedCharacters: string;
    remainingText: string;
  };
  [GameEventType.LETTER_INCORRECT]: {
    key: string;
    wordId: string | null;
    expected: string | null;
  };
  [GameEventType.WORD_COMPLETED]: {
    wordId: string;
    text: string;
    typedCharacters: string;
  };
  [GameEventType.WORD_DESTROYED]: { wordId: string; text: string };
  [GameEventType.WORD_MISSED]: { wordId: string; text: string };
  [GameEventType.ACTIVE_ENEMY_CHANGED]: {
    wordId: string | null;
    text: string | null;
  };
  [GameEventType.GAME_STARTED]: { modeId: string };
  [GameEventType.GAME_ENDED]: { reason: string };
  [GameEventType.COUNTDOWN_FINISHED]: Record<string, never>;
  [GameEventType.COMBO_INCREASED]: { combo: number };
  [GameEventType.COMBO_RESET]: Record<string, never>;
  [GameEventType.DAMAGE_TAKEN]: { amount: number };
  [GameEventType.HEALTH_CHANGED]: { health: number };
  [GameEventType.MODE_SELECTED]: { modeId: string };
  [GameEventType.GAME_PAUSED]: Record<string, never>;
  [GameEventType.GAME_RESUMED]: Record<string, never>;
}

export type GameEventName = keyof GameEventMap;
