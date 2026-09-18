export function calcWpm(correctChars: number, minutes: number): number {
  const safeMinutes = Math.max(minutes, 1 / 60);
  return Math.max(0, Math.round(correctChars / 5 / safeMinutes));
}

export function calcAccuracy(correctChars: number, totalChars: number): number {
  return Math.round((correctChars / Math.max(1, totalChars)) * 1000) / 10;
}

export function blendWpm(oldWpm: number | undefined, raceWpm: number): number {
  if (!oldWpm) return Math.round(raceWpm);
  return Math.round(oldWpm * 0.6 + raceWpm * 0.4);
}

export function elapsedMinutes(startedAt: number, endedAt: number): number {
  return Math.max(0, endedAt - startedAt) / 60000;
}
