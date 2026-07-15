/**
 * Snapshot of end-of-run stats for the Results overlay.
 * Built from StatsSystem — never recalculated in UI.
 */
export type GameOverReason = "health" | "timer" | "manual";

export interface GameResults {
  wpm: number;
  peakWpm: number;
  accuracy: number;
  correctWords: number;
  wordsMissed: number;
  correctCharacters: number;
  incorrectKeystrokes: number;
  longestCombo: number;
  longestWord: string;
  longestWordLength: number;
  wordsDestroyed: number;
  averageReactionTime: number;
  timePlayed: number;
  performanceTitle: string;
  performanceTitleId: string;
  sessionMessage: string;
  gameOverReason: GameOverReason;
  defeated: boolean;
}
