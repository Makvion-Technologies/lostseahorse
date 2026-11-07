import { placeLabel } from "./share";

/** How many top places a stranger race of this many racers awards. */
export function podiumSize(total: number): number {
  if (total <= 2) return 1;
  if (total === 3) return 2;
  return 3;
}

/** "Winner" / "1st" ... for podium places, "Lost" for the rest. */
export function placeTag(
  place: number,
  total: number,
  tied = false,
): { label: string; won: boolean } {
  if (place < 1 || total < 2) return { label: "", won: false };
  if (place > podiumSize(total)) return { label: tied ? "Tied · Lost" : "Lost", won: false };
  if (tied) return { label: total === 2 ? "Tied" : `Tied ${placeLabel(place)}`, won: true };
  return { label: total === 2 ? "Winner" : placeLabel(place), won: true };
}

/** CSS class that re-themes a Strangers racer by placing (ties share it). */
export function placeTheme(
  row: { place: number; flagged?: boolean; left?: boolean },
  total: number,
): string {
  if (row.flagged || row.left || row.place < 1 || row.place > podiumSize(total)) return "place-theme-lost";
  return `place-theme-${Math.min(row.place, 3)}`;
}
