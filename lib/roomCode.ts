import { pick, randInt } from "./rng";

const ADJECTIVES = [
  "quiet",
  "drift",
  "kelp",
  "soft",
  "pale",
  "dim",
  "still",
  "low",
  "far",
  "slow",
  "tide",
  "mist",
  "foam",
  "dusk",
  "deep",
  "calm",
  "thin",
  "lost",
  "warm",
  "cool",
] as const;

const NOUNS = [
  "tide",
  "reef",
  "foam",
  "cove",
  "kelp",
  "pool",
  "gulf",
  "bay",
  "mist",
  "current",
  "shell",
  "pearl",
  "eddy",
  "brine",
  "shoal",
  "inlet",
  "harbor",
  "wake",
  "bloom",
  "moon",
] as const;

const ALPHANUM = "abcdefghijklmnopqrstuvwxyz0123456789";

const FRIEND_CODE = /^[a-z]{3,12}-[a-z]{3,12}-[a-z0-9]{2}$/;
const SHORT_CODE = /^[A-Za-z0-9_-]{6,24}$/;

export function createRoomCode(rng = Math.random): string {
  const adj = pick(ADJECTIVES, rng);
  const noun = pick(NOUNS, rng);
  const a = ALPHANUM[randInt(0, ALPHANUM.length - 1, rng)]!;
  const b = ALPHANUM[randInt(0, ALPHANUM.length - 1, rng)]!;
  return `${adj}-${noun}-${a}${b}`;
}

export function isValidRoomCode(code: unknown): boolean {
  if (typeof code !== "string") return false;
  const trimmed = code.trim();
  if (trimmed.length < 6 || trimmed.length > 32) return false;
  return FRIEND_CODE.test(trimmed) || SHORT_CODE.test(trimmed);
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toLowerCase();
}
