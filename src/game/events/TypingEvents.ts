/**
 * Lightweight typing event bus for combat / VFX subscribers (Phase 6+).
 * TypingSystem emits; render never listens for gameplay logic.
 */

export type TypingEventType =
  | "LETTER_CORRECT"
  | "LETTER_INCORRECT"
  | "WORD_COMPLETED"
  | "WORD_MISSED"
  | "ACTIVE_ENEMY_CHANGED";

export interface TypingEventPayloads {
  LETTER_CORRECT: {
    enemyId: string;
    letter: string;
    typedCharacters: string;
    remainingText: string;
    progress: number;
  };
  LETTER_INCORRECT: {
    enemyId: string | null;
    key: string;
    expected: string | null;
  };
  WORD_COMPLETED: {
    enemyId: string;
    originalText: string;
    typedCharacters: string;
  };
  /** Enemy reached the seahorse (miss). Emitted for stats — not from TypingSystem. */
  WORD_MISSED: Record<string, never>;
  ACTIVE_ENEMY_CHANGED: {
    enemyId: string | null;
    originalText: string | null;
  };
}

type Handler<T> = (payload: T) => void;

class TypingEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners = new Map<TypingEventType, Set<Handler<any>>>();

  on<K extends TypingEventType>(
    type: K,
    handler: Handler<TypingEventPayloads[K]>,
  ): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }

  emit<K extends TypingEventType>(
    type: K,
    payload: TypingEventPayloads[K],
  ): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const handler of set) {
      handler(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const typingEvents = new TypingEventBus();
