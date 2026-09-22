import {
  isLevel,
  isTimeLimit,
  type GoalMode,
  type Level,
  type TimeLimit,
} from "./types";

export const SETUP_KEY = "lostseahorse.setup";

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
  const empty = {
    time: 30 as TimeLimit,
    level: "medium" as const,
    extras: { punctuation: false, numbers: false },
    goal: "time" as const,
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.sessionStorage.getItem(SETUP_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return empty;
    const data = parsed as {
      time?: unknown;
      level?: unknown;
      timeLabel?: unknown;
      punctuation?: unknown;
      numbers?: unknown;
      goal?: unknown;
    };
    return {
      time: isTimeLimit(data.time) ? data.time : 30,
      level: isLevel(data.level) ? data.level : "medium",
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
    return empty;
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
