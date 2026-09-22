import type { ColorHex, GameMode, Level, StyleId, TimeLimit } from "../types";

export const MAX_MESSAGE_BYTES = 2048;
export const TYPING_BATCH_MS = 50;
export const MAX_KEYS_PER_BATCH = 12;
export const MAX_KEYS_PER_SEC = 18;
export const ROOM_CAP = 6;

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
};

export type ResultRow = {
  id: string;
  name: string;
  style: StyleId;
  color: ColorHex;
  wpm: number;
  accuracy: number;
  progress: number;
  errors: number;
  place: number;
  finished: boolean;
};

export type ClientEvent =
  | {
      type: "join";
      name: string;
      style: string;
      color: string;
      settings?: RoomSettings;
      fillAi?: boolean;
      mode?: GameMode;
    }
  | { type: "start" }
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
      name: string;
      style: string;
      color: string;
      level: Level;
      time: TimeLimit;
      punctuation?: boolean;
      numbers?: boolean;
      goal?: "time" | "words";
      wpm?: number;
      firstVisit: boolean;
    }
  | { type: "cancel" };

export type MatchmakerOut =
  | { type: "waiting" }
  | { type: "matched"; code: string }
  | { type: "error"; message: string };

export type SetupPayload = {
  mode: GameMode;
  settings: RoomSettings;
  autoStart: boolean;
  expectedHumans: number;
  fillAi: boolean;
  ai?: {
    id: string;
    name: string;
    style: StyleId;
    color: ColorHex;
    homeWpm: number;
  };
};

export function parseJsonEvent(raw: string): unknown | null {
  if (raw.length > MAX_MESSAGE_BYTES) return null;
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
