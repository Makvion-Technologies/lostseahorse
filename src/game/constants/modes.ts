/**
 * Canonical game mode definitions.
 * Components must read from here — never hardcode mode values.
 */

export type GameModeId = "30" | "60" | "120" | "infinite" | "zen";

export interface ModeDefinition {
  id: GameModeId;
  label: string;
  /** Short UI description for mode cards. */
  description: string;
  /** Duration in seconds. null = no fixed duration. */
  duration: number | null;
  hasHealth: boolean;
  hasTimer: boolean;
}

export const GAME_MODES: readonly ModeDefinition[] = [
  {
    id: "30",
    label: "30 Seconds",
    description: "Quick challenge",
    duration: 30,
    hasHealth: true,
    hasTimer: true,
  },
  {
    id: "60",
    label: "60 Seconds",
    description: "Standard run",
    duration: 60,
    hasHealth: true,
    hasTimer: true,
  },
  {
    id: "120",
    label: "120 Seconds",
    description: "Endurance test",
    duration: 120,
    hasHealth: true,
    hasTimer: true,
  },
  {
    id: "infinite",
    label: "Infinite",
    description: "Until health runs out",
    duration: null,
    hasHealth: true,
    hasTimer: false,
  },
  {
    id: "zen",
    label: "Zen",
    description: "Peaceful practice",
    duration: null,
    hasHealth: false,
    hasTimer: false,
  },
] as const;

export const DEFAULT_MODE_ID: GameModeId = "60";

export function getModeById(id: GameModeId): ModeDefinition {
  const mode = GAME_MODES.find((m) => m.id === id);
  if (!mode) {
    return GAME_MODES.find((m) => m.id === DEFAULT_MODE_ID)!;
  }
  return mode;
}
