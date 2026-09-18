import { customAlphabet } from "nanoid";
import { sanitizeName } from "./names";

const ADJECTIVES = [
  "quiet",
  "drift",
  "kelp",
  "pale",
  "dim",
  "still",
  "deep",
  "calm",
  "brine",
  "salt",
  "moon",
  "dusk",
  "foam",
  "tide",
  "mist",
  "soft",
  "slow",
  "lost",
  "cool",
  "warm",
  "low",
  "thin",
  "coral",
  "reef",
  "wave",
  "far",
] as const;

const NOUNS = [
  "kelp",
  "reef",
  "foam",
  "cove",
  "tide",
  "pearl",
  "eddy",
  "shoal",
  "shell",
  "wake",
  "bloom",
  "brine",
  "gulf",
  "bay",
  "pool",
  "fin",
  "curl",
  "plume",
  "crest",
  "moon",
  "mist",
  "fry",
  "leaf",
  "pup",
  "nori",
] as const;

const unique = customAlphabet("abcdefghijkmnopqrstuvwxyz23456789", 4);

export function isOceanName(name: string): boolean {
  return /^[a-z]{2,5}-[a-z]{2,5}-[a-z0-9]{4}$/.test(name) && name.length <= 16;
}

export function createOceanName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!;
  let noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]!;
  if (noun === adj) {
    noun = NOUNS[(NOUNS.indexOf(noun) + 1) % NOUNS.length]!;
  }
  const name = `${adj}-${noun}-${unique()}`;
  return sanitizeName(name).slice(0, 16);
}
