export const TIMES = [15, 30, 60, 120] as const;
export type TimeLimit = number;

export const MIN_TIME = 0;
/** Seconds. High enough for 10000000h+; only blocked if the clock math would lose precision. */
export const MAX_TIME = Math.floor(
  (Number.MAX_SAFE_INTEGER - 10_000_000_000_000) / 1000,
);

export const LEVELS = ["easy", "medium", "hard"] as const;
export type Level = (typeof LEVELS)[number];

export const STYLES = [
  { id: "kelp", label: "Kelp" },
  { id: "foam", label: "Foam" },
  { id: "dusk", label: "Dusk" },
  { id: "pearl", label: "Pearl" },
  { id: "drift", label: "Drift" },
  { id: "lantern", label: "Lantern" },
] as const;
export type StyleId = (typeof STYLES)[number]["id"];

export const COLORS = [
  "#2A9D8F",
  "#E9C46A",
  "#E76F51",
  "#8ECAE6",
  "#B8F2E6",
  "#C77DFF",
  "#F4A261",
  "#90BE6D",
] as const;
export type ColorHex = (typeof COLORS)[number];

export const DEFAULT_STYLE: StyleId = "kelp";
export const DEFAULT_COLOR: ColorHex = COLORS[0];

export const MODES = ["practice", "stranger", "friends"] as const;
export type GameMode = (typeof MODES)[number];

export type RaceSettings = {
  time: TimeLimit;
  level: Level;
};

export type RacerLook = {
  name: string;
  style: StyleId;
  color: ColorHex;
};

export function isTimeLimit(value: unknown): value is TimeLimit {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_TIME &&
    value <= MAX_TIME
  );
}

export function isPresetTime(value: number): boolean {
  return (TIMES as readonly number[]).includes(value);
}

export function isLevel(value: unknown): value is Level {
  return LEVELS.includes(value as Level);
}

export function isStyleId(value: unknown): value is StyleId {
  return STYLES.some((style) => style.id === value);
}

export function isColorHex(value: unknown): value is ColorHex {
  return COLORS.includes(value as ColorHex);
}

export function isGameMode(value: unknown): value is GameMode {
  return MODES.includes(value as GameMode);
}
