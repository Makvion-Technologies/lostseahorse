/**
 * Results titles and session messages.
 * Thresholds live here — never hardcode inside UI components.
 */

export interface PerformanceTitleTier {
  id: string;
  title: string;
  /** Minimum final WPM required */
  minWpm: number;
  /** Minimum accuracy (0–100) required */
  minAccuracy: number;
}

/**
 * Ordered low → high. Highest matching tier wins.
 */
export const PERFORMANCE_TITLE_TIERS: readonly PerformanceTitleTier[] = [
  {
    id: "ocean-beginner",
    title: "Ocean Beginner",
    minWpm: 0,
    minAccuracy: 0,
  },
  {
    id: "coral-explorer",
    title: "Coral Explorer",
    minWpm: 20,
    minAccuracy: 70,
  },
  {
    id: "sea-wanderer",
    title: "Sea Wanderer",
    minWpm: 35,
    minAccuracy: 80,
  },
  {
    id: "current-rider",
    title: "Current Rider",
    minWpm: 45,
    minAccuracy: 85,
  },
  {
    id: "ocean-guardian",
    title: "Ocean Guardian",
    minWpm: 55,
    minAccuracy: 90,
  },
  {
    id: "seahorse-protector",
    title: "Seahorse Protector",
    minWpm: 65,
    minAccuracy: 93,
  },
  {
    id: "keeper-of-the-abyss",
    title: "Keeper of the Abyss",
    minWpm: 80,
    minAccuracy: 96,
  },
] as const;

export const SESSION_MESSAGES: readonly string[] = [
  "The Lost Seahorse survived thanks to your steady typing.",
  "Your accuracy helped guide the seahorse safely.",
  "You held back the ocean for longer than before.",
  "Every keystroke was a quiet act of protection.",
  "The currents were kind to those who type with care.",
  "You gave the seahorse a few more moments of calm.",
  "Your focus turned chaos into a gentle rhythm.",
  "The deep remembers those who defend its lost ones.",
] as const;

/** Delay after cinematic before results panel (ms). */
export const RESULTS_REVEAL_DELAY_MS = 900;

/** Stagger between stat rows (ms). */
export const RESULTS_STAT_STAGGER_MS = 90;

/** Duration of each count-up animation (ms). */
export const RESULTS_COUNT_UP_MS = 900;

export function resolvePerformanceTitle(
  wpm: number,
  accuracy: number,
): PerformanceTitleTier {
  let best = PERFORMANCE_TITLE_TIERS[0];
  for (const tier of PERFORMANCE_TITLE_TIERS) {
    if (wpm >= tier.minWpm && accuracy >= tier.minAccuracy) {
      best = tier;
    }
  }
  return best;
}

export function pickSessionMessage(seed: number): string {
  const list = SESSION_MESSAGES;
  if (list.length === 0) return "";
  const idx = Math.abs(Math.floor(seed)) % list.length;
  return list[idx]!;
}
