import { typingEvents } from "@/game/events/TypingEvents";
import {
  createEmptyStats,
  type SessionStats,
} from "@/game/stats/types";
import type { GameSystem } from "./types";

/**
 * Statistics engine — independent of rendering and combat.
 * Subscribes to typing events; never validates keys or mutates enemies.
 */
export class StatsSystem implements GameSystem {
  readonly name = "StatsSystem";

  private stats: SessionStats = createEmptyStats();
  private activeStartedAt = new Map<string, number>();
  private unsubs: Array<() => void> = [];
  private active = false;
  private paused = false;
  /** Session clock (seconds) while not paused */
  private clock = 0;
  private listeners = new Set<() => void>();

  getSnapshot(): Readonly<SessionStats> {
    return this.stats;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  init(): void {
    if (this.active) return;
    this.active = true;
    this.paused = false;
    this.clock = 0;
    this.stats = createEmptyStats();
    this.activeStartedAt.clear();

    this.unsubs.push(
      typingEvents.on("LETTER_CORRECT", () => {
        if (this.paused) return;
        this.stats.correctCharacters += 1;
        this.stats.totalKeystrokes += 1;
        this.recomputeRates();
        this.notify();
      }),
    );

    this.unsubs.push(
      typingEvents.on("LETTER_INCORRECT", () => {
        if (this.paused) return;
        this.stats.incorrectKeystrokes += 1;
        this.stats.totalKeystrokes += 1;
        this.recomputeRates();
        this.notify();
      }),
    );

    this.unsubs.push(
      typingEvents.on("WORD_COMPLETED", (payload) => {
        if (this.paused) return;
        this.stats.correctWords += 1;
        this.stats.enemiesDestroyed += 1;
        this.stats.combo += 1;
        if (this.stats.combo > this.stats.highestCombo) {
          this.stats.highestCombo = this.stats.combo;
        }

        const len = payload.originalText.length;
        if (len > this.stats.longestWordLength) {
          this.stats.longestWordLength = len;
          this.stats.longestWord = payload.originalText;
        }

        const started = this.activeStartedAt.get(payload.enemyId);
        if (started !== undefined) {
          const reaction = Math.max(0, this.clock - started);
          const n = this.stats.reactionSampleCount;
          this.stats.averageReactionTime =
            (this.stats.averageReactionTime * n + reaction) / (n + 1);
          this.stats.reactionSampleCount = n + 1;
          this.activeStartedAt.delete(payload.enemyId);
        }

        this.recomputeRates();
        this.notify();
      }),
    );

    this.unsubs.push(
      typingEvents.on("ACTIVE_ENEMY_CHANGED", (payload) => {
        if (this.paused) return;
        if (payload.enemyId) {
          this.activeStartedAt.set(payload.enemyId, this.clock);
        }
      }),
    );

    this.unsubs.push(
      typingEvents.on("WORD_MISSED", () => {
        if (this.paused) return;
        this.stats.missedWords += 1;
        this.stats.combo = 0;
        this.notify();
      }),
    );

    this.notify();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  /**
   * Enemy reached the seahorse (miss). Called from thin store hook — not typing logic.
   */
  onWordMissed(): void {
    if (!this.active || this.paused) return;
    typingEvents.emit("WORD_MISSED", {});
  }

  /**
   * Advance session clock and smooth WPM. Call only while PLAYING.
   */
  update(deltaSeconds: number): void {
    if (!this.active || this.paused) return;
    const dt = Math.min(0.05, Math.max(0, deltaSeconds));
    this.clock += dt;
    this.stats.elapsedSeconds = this.clock;
    this.recomputeRates();

    // Exponential smooth display WPM — prevents flicker
    const alpha = 1 - Math.exp(-dt * 4.5);
    this.stats.displayWpm +=
      (this.stats.rawWpm - this.stats.displayWpm) * alpha;

    if (this.stats.rawWpm > this.stats.peakWpm) {
      this.stats.peakWpm = this.stats.rawWpm;
    }

    this.notify();
  }

  private recomputeRates(): void {
    const minutes = Math.max(this.stats.elapsedSeconds / 60, 1 / 6000);
    this.stats.rawWpm =
      this.stats.correctCharacters > 0
        ? this.stats.correctCharacters / 5 / minutes
        : 0;

    if (this.stats.totalKeystrokes > 0) {
      this.stats.accuracy =
        (this.stats.correctCharacters / this.stats.totalKeystrokes) * 100;
    } else {
      this.stats.accuracy = 100;
    }
  }

  dispose(): void {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    this.active = false;
    this.paused = false;
    this.activeStartedAt.clear();
    this.stats = createEmptyStats();
    this.clock = 0;
    this.notify();
  }
}

export const statsSystem = new StatsSystem();
