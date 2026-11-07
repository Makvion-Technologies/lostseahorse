/** Racer name rules, shared by the client and the profiles party. */

import { isBotName } from "./racerNames";

export const NAME_MIN = 3;
export const NAME_MAX = 16;
const NAME_RE = /^[A-Za-z0-9_-]+$/;
/** Profile ids are crypto.randomUUID() values. */
export const PROFILE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Light blocklist: matched against the name with separators and digit
// look-alikes stripped. Kept short on purpose; easy to extend.
const BLOCKED = [
  "fuck", "shit", "bitch", "cunt", "dick", "pussy", "nigg", "fag", "slut",
  "whore", "rape", "nazi", "hitler", "porn", "cock", "asshole", "retard",
];
const RESERVED = ["admin", "moderator", "lostseahorse", "official", "system", "support"];

function squash(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_-]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/\$/g, "s");
}

export function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Returns a friendly problem, or null when the name is allowed. */
export function nameProblem(raw: unknown): string | null {
  if (typeof raw !== "string") return "Pick a name.";
  const name = raw.trim();
  if (name.length < NAME_MIN) return `At least ${NAME_MIN} characters.`;
  if (name.length > NAME_MAX) return `At most ${NAME_MAX} characters.`;
  if (!NAME_RE.test(name)) return "Letters, numbers, _ and - only.";
  if (!/[A-Za-z]/.test(name)) return "Include at least one letter.";
  const flat = squash(name);
  if (BLOCKED.some((word) => flat.includes(word))) return "Try a different name.";
  if (RESERVED.includes(flat)) return "That name is reserved.";
  // Server racers use these; reported as taken so they read like real people.
  if (isBotName(name)) return "That name is taken.";
  return null;
}

export type ProfileStats = { races: number; bestWpm: number; lastWpm: number };

export type Profile = {
  id: string;
  name: string;
  /** Recent rename times (ms), for the server's rename limits. */
  renames?: number[];
  createdAt: number;
  stats: ProfileStats;
};

/** Rename limits (server-enforced): a short cooldown plus a rolling daily cap. */
export const RENAME_COOLDOWN_MS = 60_000;
export const RENAME_WINDOW_MS = 24 * 60 * 60 * 1000;
export const RENAME_MAX_PER_WINDOW = 5;

/** "45s", "3 min", "2 h": friendly wait for rename errors. */
export function waitLabel(ms: number): string {
  const s = Math.max(1, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.ceil(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.ceil(m / 60)} h`;
}
