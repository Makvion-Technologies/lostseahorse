import { EnemyState, type EnemyWordEntity } from "@/game/types/Enemy";
import { typingEvents } from "@/game/events/TypingEvents";

export interface TypingProcessResult {
  handled: boolean;
  correct: boolean;
  completedWord: boolean;
  enemyId: string | null;
  letter: string | null;
}

/**
 * Pure typing engine.
 * Receives keys, validates against the active enemy, updates entity fields.
 * Never touches React components.
 */
export class TypingSystem {
  readonly name = "TypingSystem";

  /**
   * Whether a key is a processable character for Phase 5 (a–z only).
   * Punctuation / numbers can be enabled later without changing call sites.
   */
  isTypeableKey(key: string): boolean {
    return key.length === 1 && /^[a-zA-Z]$/.test(key);
  }

  normalizeKey(key: string): string {
    return key.toLowerCase();
  }

  /**
   * Pick the first word the player should type:
   * oldest on screen (lowest spawnIndex) among targetable enemies.
   * That is the first word that became visible — FIFO, not "closest".
   */
  selectPrimaryEnemy(enemies: EnemyWordEntity[]): EnemyWordEntity | null {
    let best: EnemyWordEntity | null = null;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!this.isTargetable(e)) continue;
      if (!best || e.spawnIndex < best.spawnIndex) {
        best = e;
      }
    }

    return best;
  }

  /**
   * Word that will become active after the current one (FIFO preview).
   * Pure selection — does not change typing state.
   */
  selectNextEnemy(
    enemies: EnemyWordEntity[],
    activeId: string | null,
  ): EnemyWordEntity | null {
    let primary: EnemyWordEntity | null = null;
    let next: EnemyWordEntity | null = null;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!this.isTargetable(e)) continue;
      if (activeId && e.id === activeId) {
        primary = e;
        continue;
      }
      // Prefer oldest among non-active targetables
      if (!next || e.spawnIndex < next.spawnIndex) {
        next = e;
      }
    }

    // If no explicit active, next is the second-oldest overall
    if (!activeId || !primary) {
      const ordered: EnemyWordEntity[] = [];
      for (let i = 0; i < enemies.length; i++) {
        if (this.isTargetable(enemies[i])) ordered.push(enemies[i]);
      }
      ordered.sort((a, b) => a.spawnIndex - b.spawnIndex);
      return ordered[1] ?? null;
    }

    // Next = oldest targetable with spawnIndex > active's (or any other oldest if ids differ)
    let bestAfter: EnemyWordEntity | null = null;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!this.isTargetable(e) || e.id === activeId) continue;
      if (e.spawnIndex <= primary.spawnIndex) continue;
      if (!bestAfter || e.spawnIndex < bestAfter.spawnIndex) {
        bestAfter = e;
      }
    }
    // Fallback: any other targetable (shouldn't happen with strict FIFO indices)
    return bestAfter ?? next;
  }

  /** @deprecated Use selectPrimaryEnemy — kept for call-site clarity. */
  selectClosestEnemy(enemies: EnemyWordEntity[]): EnemyWordEntity | null {
    return this.selectPrimaryEnemy(enemies);
  }

  isTargetable(enemy: EnemyWordEntity): boolean {
    return (
      enemy.state !== EnemyState.COMPLETED &&
      enemy.state !== EnemyState.DESTROYING &&
      enemy.state !== EnemyState.DESTROYED &&
      enemy.state !== EnemyState.BREACHING &&
      enemy.state !== EnemyState.IDLE &&
      enemy.remainingText.length > 0
    );
  }

  /**
   * Ensure exactly one active enemy among the roster.
   * Always locks onto the oldest living word so the first-visible word is typeable.
   * Mid-word: stays on the same active until completed (no mid-type switching),
   * unless that word is no longer targetable (e.g. left the screen in Zen).
   */
  ensureActiveEnemy(enemies: EnemyWordEntity[]): string | null {
    const current = enemies.find((e) => e.isActive && this.isTargetable(e));
    if (current) {
      // Keep typing the word you already started — only while still valid
      if (current.typedCharacters.length > 0) {
        this.clearActiveExcept(enemies, current.id);
        return current.id;
      }
      // Not started yet — prefer oldest so the first-visible word is always active
      const primary = this.selectPrimaryEnemy(enemies);
      if (primary && primary.id !== current.id) {
        this.clearActiveExcept(enemies, primary.id);
        primary.isActive = true;
        typingEvents.emit("ACTIVE_ENEMY_CHANGED", {
          enemyId: primary.id,
          originalText: primary.originalText,
        });
        return primary.id;
      }
      this.clearActiveExcept(enemies, current.id);
      return current.id;
    }

    // Active was cleared (typed out, missed, or left the screen) — pick next
    for (const e of enemies) {
      e.isActive = false;
    }

    const next = this.selectPrimaryEnemy(enemies);
    if (!next) {
      typingEvents.emit("ACTIVE_ENEMY_CHANGED", {
        enemyId: null,
        originalText: null,
      });
      return null;
    }

    next.isActive = true;
    typingEvents.emit("ACTIVE_ENEMY_CHANGED", {
      enemyId: next.id,
      originalText: next.originalText,
    });
    return next.id;
  }

  private clearActiveExcept(enemies: EnemyWordEntity[], id: string): void {
    for (const e of enemies) {
      e.isActive = e.id === id;
    }
  }

  getActiveEnemy(enemies: EnemyWordEntity[]): EnemyWordEntity | null {
    return enemies.find((e) => e.isActive && this.isTargetable(e)) ?? null;
  }

  /**
   * Process one physical key press against the active enemy.
   */
  processKey(
    enemies: EnemyWordEntity[],
    rawKey: string,
  ): TypingProcessResult {
    if (!this.isTypeableKey(rawKey)) {
      return {
        handled: false,
        correct: false,
        completedWord: false,
        enemyId: null,
        letter: null,
      };
    }

    const key = this.normalizeKey(rawKey);
    this.ensureActiveEnemy(enemies);
    const active = this.getActiveEnemy(enemies);

    if (!active) {
      return {
        handled: true,
        correct: false,
        completedWord: false,
        enemyId: null,
        letter: key,
      };
    }

    const expected = active.remainingText[0] ?? null;

    if (expected !== null && key === expected) {
      return this.applyCorrectLetter(enemies, active, key);
    }

    typingEvents.emit("LETTER_INCORRECT", {
      enemyId: active.id,
      key,
      expected,
    });

    return {
      handled: true,
      correct: false,
      completedWord: false,
      enemyId: active.id,
      letter: key,
    };
  }

  private applyCorrectLetter(
    enemies: EnemyWordEntity[],
    active: EnemyWordEntity,
    key: string,
  ): TypingProcessResult {
    active.typedCharacters += key;
    active.remainingText = active.remainingText.slice(1);
    this.recomputeProgress(active);

    typingEvents.emit("LETTER_CORRECT", {
      enemyId: active.id,
      letter: key,
      typedCharacters: active.typedCharacters,
      remainingText: active.remainingText,
      progress: active.progress,
    });

    if (active.remainingText.length === 0) {
      active.state = EnemyState.COMPLETED;
      active.isActive = false;
      active.velocity.x = 0;
      active.velocity.y = 0;
      active.velocity.z = 0;
      active.currentSpeed = 0;
      active.progress = 1;
      active.progressPercentage = 100;
      active.remainingCharacters = 0;

      typingEvents.emit("WORD_COMPLETED", {
        enemyId: active.id,
        originalText: active.originalText,
        typedCharacters: active.typedCharacters,
      });

      const nextId = this.ensureActiveEnemy(enemies);

      return {
        handled: true,
        correct: true,
        completedWord: true,
        enemyId: nextId ?? active.id,
        letter: key,
      };
    }

    return {
      handled: true,
      correct: true,
      completedWord: false,
      enemyId: active.id,
      letter: key,
    };
  }

  recomputeProgress(enemy: EnemyWordEntity): void {
    const total = enemy.originalText.length || 1;
    const typed = enemy.typedCharacters.length;
    enemy.progress = Math.min(1, typed / total);
    enemy.progressPercentage = Math.round(enemy.progress * 1000) / 10;
    enemy.remainingCharacters = enemy.remainingText.length;
  }

  init(): void {
    // no-op — state lives on enemies
  }

  update(_deltaSeconds: number): void {
    void _deltaSeconds;
  }

  dispose(): void {
    // Subscribers clear themselves
  }
}

export const typingSystem = new TypingSystem();
