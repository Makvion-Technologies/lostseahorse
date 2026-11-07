import {
  isLevel,
  isTimeLimit,
  type GoalMode,
  type Level,
  type TimeLimit,
} from "./types";

export const SETUP_KEY = "lostseahorse.setup";

export const DEFAULT_SETUP = {
  time: 30 as TimeLimit,
  level: "easy" as const,
  extras: { punctuation: false, numbers: false },
  goal: "time" as const,
};

export type SetupExtras = {
  punctuation: boolean;
  numbers: boolean;
};

export function loadSetup(): {
  time: TimeLimit;
  level: Level;
  timeLabel?: string;
  extras: SetupExtras;
  goal: GoalMode;
} {
  if (typeof window === "undefined") return DEFAULT_SETUP;
  try {
    const raw = window.sessionStorage.getItem(SETUP_KEY);
    if (!raw) return DEFAULT_SETUP;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return DEFAULT_SETUP;
    const data = parsed as {
      time?: unknown;
      level?: unknown;
      timeLabel?: unknown;
      punctuation?: unknown;
      numbers?: unknown;
      goal?: unknown;
    };
    return {
      time: isTimeLimit(data.time) ? data.time : DEFAULT_SETUP.time,
      level: isLevel(data.level) ? data.level : DEFAULT_SETUP.level,
      timeLabel:
        typeof data.timeLabel === "string" && data.timeLabel.trim()
          ? data.timeLabel.trim()
          : undefined,
      extras: {
        punctuation: data.punctuation === true,
        numbers: data.numbers === true,
      },
      goal: data.goal === "words" ? "words" : "time",
    };
  } catch {
    return DEFAULT_SETUP;
  }
}

export function saveSetup(
  time: TimeLimit,
  level: Level,
  timeLabel?: string,
  extras: SetupExtras = { punctuation: false, numbers: false },
  goal: GoalMode = "time",
) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SETUP_KEY,
    JSON.stringify({
      time,
      level,
      punctuation: extras.punctuation,
      numbers: extras.numbers,
      goal,
      ...(timeLabel ? { timeLabel } : {}),
    }),
  );
}
