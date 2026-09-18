import { isLevel, isTimeLimit, type Level, type TimeLimit } from "./types";

export const SETUP_KEY = "lostseahorse.setup";

export function loadSetup(): { time: TimeLimit; level: Level } {
  if (typeof window === "undefined") return { time: 30, level: "medium" };
  try {
    const raw = window.sessionStorage.getItem(SETUP_KEY);
    if (!raw) return { time: 30, level: "medium" };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { time: 30, level: "medium" };
    }
    const data = parsed as { time?: unknown; level?: unknown };
    return {
      time: isTimeLimit(data.time) ? data.time : 30,
      level: isLevel(data.level) ? data.level : "medium",
    };
  } catch {
    return { time: 30, level: "medium" };
  }
}

export function saveSetup(time: TimeLimit, level: Level) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SETUP_KEY, JSON.stringify({ time, level }));
}
