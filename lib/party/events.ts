import type { ColorHex, GameMode, Level, StyleId, TimeLimit } from "../types";

export const MAX_MESSAGE_BYTES = 2048;
export const TYPING_BATCH_MS = 50;
export const MAX_KEYS_PER_BATCH = 12;
export const MAX_KEYS_PER_SEC = 18;
export const ROOM_CAP = 6;
/** Friends rooms: smallest and largest room size. */
export const FRIENDS_MIN = 2;
export const FRIENDS_MAX = 10;
/** Max keystrokes kept per racer for the results graph/replay. */
export const MAX_KEY_LOG = 6000;

/** One keystroke: [ms since race start, key]; "\b" is Backspace. */
export type KeyLogEntry = [number, string];
/** Max humans in an Open stranger match. */
/** Results above this are treated as impossible and not ranked. */
export const MAX_PLAUSIBLE_WPM = 260;

export const MATCH_SIZES = ["1v1", "1v2", "1v3", "1v5"] as const;
export type MatchSize = (typeof MATCH_SIZES)[number];

/** Total racers in a match of this size. */
export const SIZE_SEATS: Record<MatchSize, number> = { "1v1": 2, "1v2": 3, "1v3": 4, "1v5": 6 };

export function isMatchSize(value: unknown): value is MatchSize {
  return (MATCH_SIZES as readonly unknown[]).includes(value);
}

export type RoomStatus = "lobby" | "countdown" | "racing" | "results";

export type PlayerPublic = {
  id: string;
  name: string;
  style: StyleId;
  color: ColorHex;
  progress: number;
  typed: number;
  errors: number;
  totalChars: number;
  finished: boolean;
  connected: boolean;
};

export type RoomSettings = {
  time: TimeLimit;
  level: Level;
  punctuation?: boolean;
  numbers?: boolean;
  goal?: "time" | "words";
};

export type RoomState = {
  code: string;
  mode: GameMode;
  status: RoomStatus;
  settings: RoomSettings;
  passage: string;
  players: PlayerPublic[];
  hostId: string | null;
  fillAi: boolean;
  startedAt: number | null;
  endsAt: number | null;
  countdownEndsAt: number | null;
  youAreHost: boolean;
  /** Server clock when this snapshot was sent (for countdown sync). */
  serverNow?: number;
  /** Humans the matchmaker expects (stranger rooms). */
  expectedHumans?: number;
  /** Friends rooms: hard cap on racers. */
  maxPlayers?: number;
};

export type ResultRow = {
  id: string;
  name: string;
  style: StyleId;
  color: ColorHex;
  wpm: number;
  /** Raw WPM (all typed chars) over the same window as `wpm`. */
  rawWpm: number;
  /** Seconds from race start to this player's finish (or race end). */
  elapsed: number;
  accuracy: number;
  progress: number;
  errors: number;
  place: number;
  finished: boolean;
  /** Disconnected before the race ended. */
  left?: boolean;
  /** Result discarded as implausible. */
  flagged?: boolean;
  /** Shares this place with another racer (everything identical). */
  tied?: boolean;
  /** Every keystroke the server applied, so anyone's run can be rebuilt. */
  keys?: KeyLogEntry[];
};

export type ClientEvent =
  | {
      type: "join";
      /** Profile id; the server looks the name up. */
      pid?: string;
      name?: string;
      style: string;
      color: string;
      settings?: RoomSettings;
      fillAi?: boolean;
      mode?: GameMode;
      /** Friends rooms: room size picked by the creator. */
      max?: number;
    }
  | { type: "start" }
  /** Friends rooms: back to the room lobby after results. */
  | { type: "again" }
  | { type: "fillAi"; on: boolean }
  | { type: "typed"; keys: string }
  | { type: "finish" };

export type ServerEvent =
  | { type: "state"; state: RoomState }
  | {
      type: "progress";
      id: string;
      progress: number;
      typed: number;
      errors: number;
    }
  | { type: "results"; results: ResultRow[]; endedAt: number }
  | { type: "error"; message: string };

export type MatchmakerIn =
  | {
      type: "queue";
      pid?: string;
      name?: string;
      style: string;
      color: string;
      level: Level;
      time: TimeLimit;
      punctuation?: boolean;
      numbers?: boolean;
      goal?: "time" | "words";
      wpm?: number;
      firstVisit: boolean;
      size?: MatchSize;
      clientId?: string;
    }
  | { type: "cancel" }
  | { type: "bot" };

export type MatchmakerOut =
  | { type: "waiting"; count?: number; size?: MatchSize }
  | { type: "replaced" }
  | { type: "matched"; code: string; /** Everyone else in the match (names only). */ names?: string[] }
  | { type: "error"; message: string };

export type SetupPayload = {
  mode: GameMode;
  settings: RoomSettings;
  autoStart: boolean;
  expectedHumans: number;
  fillAi: boolean;
  ai?: SetupAi;
  /** Extra bots seated from the start (stranger matches filled to size). */
  ais?: SetupAi[];
};

export type SetupAi = {
  id: string;
  name: string;
  style: StyleId;
  color: ColorHex;
  homeWpm: number;
};

export function parseJsonEvent(raw: string): unknown | null {
  if (raw.length > MAX_MESSAGE_BYTES) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Server -> client messages can be large (results carry keystroke logs). */
export const MAX_SERVER_MESSAGE_BYTES = 4_000_000;

/** Parse a message from the server; the 2 KB cap is for client input only. */
export function parseServerEvent(raw: string): unknown | null {
  if (raw.length > MAX_SERVER_MESSAGE_BYTES) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}
