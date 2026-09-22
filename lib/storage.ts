import { STYLES } from "./types";
import { sanitizeName } from "./names";
import { createOceanName, isOceanName } from "./oceanName";
import { blendWpm } from "./wpm";

export const SAVE_KEY = "lostseahorse.save";

export type SaveTheme = "light" | "dark" | "system";

export type Save = {
  name: string;
  theme: SaveTheme;
  wpm?: number;
  races: number;
  unlocked: string[];
};

const DEFAULT_UNLOCKED = STYLES.map((style) => style.id);

export const DEFAULT_SAVE: Save = {
  name: "",
  theme: "system",
  races: 0,
  unlocked: [...DEFAULT_UNLOCKED],
};

function isTheme(value: unknown): value is SaveTheme {
  return value === "light" || value === "dark" || value === "system";
}

export function parseSave(raw: unknown): Save {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SAVE };
  const data = raw as Record<string, unknown>;
  const unlocked = Array.isArray(data.unlocked)
    ? data.unlocked.filter((id): id is string => typeof id === "string")
    : [...DEFAULT_UNLOCKED];

  return {
    name: sanitizeName(data.name, ""),
    theme: isTheme(data.theme) ? data.theme : "system",
    wpm:
      typeof data.wpm === "number" && Number.isFinite(data.wpm)
        ? Math.max(0, Math.round(data.wpm))
        : undefined,
    races:
      typeof data.races === "number" && Number.isFinite(data.races)
        ? Math.max(0, Math.round(data.races))
        : 0,
    unlocked: unlocked.length ? unlocked : [...DEFAULT_UNLOCKED],
  };
}

export function loadSave(): Save {
  if (typeof window === "undefined") return { ...DEFAULT_SAVE };
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    return parseSave(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

/** Seed a unique ocean name without dispatching (safe in getSnapshot). */
export function seedIdentitySnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    const save = parseSave(raw ? (JSON.parse(raw) as unknown) : null);
    if (isOceanName(save.name)) return raw ?? JSON.stringify(save);
    const next: Save = {
      ...save,
      name: createOceanName(),
    };
    const encoded = JSON.stringify(next);
    window.localStorage.setItem(SAVE_KEY, encoded);
    return encoded;
  } catch {
    return "";
  }
}

export function writeSave(partial: Partial<Save>): Save {
  const next = parseSave({ ...loadSave(), ...partial });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("lostseahorse:save"));
  }
  return next;
}

export function updateWpm(raceWpm: number): Save {
  const save = loadSave();
  return writeSave({
    wpm: blendWpm(save.wpm, raceWpm),
    races: save.races + 1,
  });
}

