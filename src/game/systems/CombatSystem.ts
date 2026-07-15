import type { GameSystem } from "./types";
import { typingEvents } from "@/game/events/TypingEvents";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { audioManager } from "@/game/audio/AudioManager";

/**
 * Combat visualization system.
 * Subscribes to TypingSystem events — never validates keys or duplicates typing logic.
 */
export class CombatSystem implements GameSystem {
  readonly name = "CombatSystem";
  private unsubs: Array<() => void> = [];
  private active = false;

  init(): void {
    if (this.active) return;
    this.active = true;
    combatRuntime.reset();

    this.unsubs.push(
      typingEvents.on("LETTER_CORRECT", (payload) => {
        combatRuntime.onLetterCorrect({
          enemyId: payload.enemyId,
          letter: payload.letter,
          remainingText: payload.remainingText,
        });
        audioManager.playAttack();
        if (payload.remainingText.length === 0) {
          // Final letter — explosion cue slightly delayed to match impact
          window.setTimeout(() => audioManager.playExplosion(), 90);
        } else {
          window.setTimeout(() => audioManager.playLetterHit(), 70);
        }
      }),
    );

    this.unsubs.push(
      typingEvents.on("WORD_COMPLETED", (payload) => {
        combatRuntime.onWordCompleted({ enemyId: payload.enemyId });
        audioManager.playBubblePop();
      }),
    );

    this.unsubs.push(
      typingEvents.on("LETTER_INCORRECT", (payload) => {
        if (payload.enemyId) {
          combatRuntime.onLetterIncorrect({ enemyId: payload.enemyId });
        }
        audioManager.playWrongLetter();
      }),
    );
  }

  update(deltaSeconds: number): void {
    combatRuntime.update(deltaSeconds);
  }

  dispose(): void {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    combatRuntime.reset();
    this.active = false;
  }
}

export const combatSystem = new CombatSystem();
