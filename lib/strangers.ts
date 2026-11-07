import { isLevel, type Level } from "./types";
import { isMatchSize, type MatchSize } from "./party/events";
import { loadSetup } from "./setup";

export const STRANGER_KEY = "lostseahorse.strangers";

/** One-tap race lengths, in seconds. */
export const STRANGER_LENGTHS = ["15", "30", "60", "120"] as const;
export type StrangerLength = (typeof STRANGER_LENGTHS)[number];

export type StrangerPrefs = {
  length: StrangerLength;
  level: Level;
  size: MatchSize;
};

export const DEFAULT_STRANGER: StrangerPrefs = {
  length: "30",
  level: "easy",
  size: "1v1",
};

export function loadStrangerPrefs(): StrangerPrefs {
  if (typeof window === "undefined") return DEFAULT_STRANGER;
  try {
    const raw = window.localStorage.getItem(STRANGER_KEY);
    // First time: keep the level they already use in solo.
    if (!raw) return { ...DEFAULT_STRANGER, level: loadSetup().level ?? DEFAULT_STRANGER.level };
    const data = JSON.parse(raw) as Record<string, unknown>;
    // Old saves: "words" length becomes 30s, "open" size becomes 1v1.
    return {
      length: STRANGER_LENGTHS.includes(data.length as StrangerLength)
        ? (data.length as StrangerLength)
        : DEFAULT_STRANGER.length,
      level: isLevel(data.level) ? data.level : DEFAULT_STRANGER.level,
      size: isMatchSize(data.size) ? data.size : DEFAULT_STRANGER.size,
    };
  } catch {
    return DEFAULT_STRANGER;
  }
}

export function saveStrangerPrefs(prefs: StrangerPrefs) {
  try {
    window.localStorage.setItem(STRANGER_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode: keep in memory only */
  }
}

export function queueSettings(prefs: StrangerPrefs) {
  return { goal: "time" as const, time: Number(prefs.length) };
}

export function lengthLabel(prefs: StrangerPrefs): string {
  return `${prefs.length}s`;
}
