/**
 * Session statistics — independent of rendering.
 * Populated by StatsSystem for HUD and future Results.
 */
export interface SessionStats {
  correctCharacters: number;
  incorrectKeystrokes: number;
  totalKeystrokes: number;
  correctWords: number;
  missedWords: number;
  enemiesDestroyed: number;
  elapsedSeconds: number;
  combo: number;
  highestCombo: number;
  longestWord: string;
  longestWordLength: number;
  /** Instantaneous raw WPM from formula */
  rawWpm: number;
  /** Smoothed WPM for display */
  displayWpm: number;
  peakWpm: number;
  /** 0–100 with one decimal semantics stored as number */
  accuracy: number;
  /** Average reaction time in seconds (active → completed) */
  averageReactionTime: number;
  reactionSampleCount: number;
}

export const createEmptyStats = (): SessionStats => ({
  correctCharacters: 0,
  incorrectKeystrokes: 0,
  totalKeystrokes: 0,
  correctWords: 0,
  missedWords: 0,
  enemiesDestroyed: 0,
  elapsedSeconds: 0,
  combo: 0,
  highestCombo: 0,
  longestWord: "",
  longestWordLength: 0,
  rawWpm: 0,
  displayWpm: 0,
  peakWpm: 0,
  accuracy: 100,
  averageReactionTime: 0,
  reactionSampleCount: 0,
});
