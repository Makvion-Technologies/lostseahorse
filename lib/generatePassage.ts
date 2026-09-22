import type { Level, TimeLimit } from "./types";
import { pick, randFloat } from "./rng";
import { allWordLists, wordsFor } from "./words";

const TARGET_CHARS: Record<number, Record<Level, number>> = {
  15: { easy: 90, medium: 110, hard: 120 },
  30: { easy: 180, medium: 220, hard: 240 },
  60: { easy: 320, medium: 360, hard: 400 },
  120: { easy: 400, medium: 400, hard: 400 },
};

const MAX_CHARS = 400;

const PLAIN = /^[A-Za-z]+$/;

function plainWords(list: string[]): string[] {
  return list.filter((word) => PLAIN.test(word));
}

const LISTS = allWordLists();
const EASY = plainWords(LISTS.easy);
const MEDIUM = plainWords(LISTS.medium);
const HARD = plainWords(LISTS.hard);

export type WordExtras = {
  punctuation?: boolean;
  numbers?: boolean;
};

const PUNCT = [",", ".", "?", "!", ";", ":"] as const;

function pickWord(level: Level, rng: () => number): string {
  if (level === "easy") return pick(EASY, rng);
  if (level === "medium") {
    return rng() < 0.45 ? pick(EASY, rng) : pick(MEDIUM, rng);
  }
  return rng() < 0.4 ? pick(MEDIUM, rng) : pick(HARD, rng);
}

function numberToken(rng: () => number): string {
  const digits = 1 + Math.floor(rng() * 4);
  let out = "";
  for (let i = 0; i < digits; i++) {
    const d = i === 0 && digits > 1 ? 1 + Math.floor(rng() * 9) : Math.floor(rng() * 10);
    out += String(d);
  }
  return out;
}

function flavorWord(
  word: string,
  extras: WordExtras | undefined,
  rng: () => number,
): string {
  if (extras?.numbers && rng() < 0.16) return numberToken(rng);
  if (extras?.punctuation && rng() < 0.2) return word + pick(PUNCT, rng);
  return word;
}

export function generateWords(opts: {
  level: Level;
  count: number;
  rng: () => number;
  extras?: WordExtras;
}): string[] {
  const words: string[] = [];
  const target = Math.max(1, opts.count);
  while (words.length < target) {
    words.push(flavorWord(pickWord(opts.level, opts.rng), opts.extras, opts.rng));
  }
  return words;
}

export function generatePassage(opts: {
  level: Level;
  time: TimeLimit;
  rng: () => number;
  extras?: WordExtras;
}): string {
  const preset = TARGET_CHARS[opts.time];
  const target = preset
    ? preset[opts.level]
    : Math.min(
        MAX_CHARS,
        Math.round((TARGET_CHARS[60][opts.level] * opts.time) / 60),
      );
  const words: string[] = [];
  let chars = 0;

  while (chars < target) {
    const word = flavorWord(
      pickWord(opts.level, opts.rng),
      opts.extras,
      opts.rng,
    );
    const extra = words.length === 0 ? word.length : word.length + 1;
    if (chars + extra > MAX_CHARS) break;
    words.push(word);
    chars += extra;
    if (words.length > 120) break;
  }

  if (words.length === 0) {
    return pick(wordsFor(opts.level), opts.rng);
  }

  return words.join(" ");
}

export function jitter(base: number, rng: () => number, spread = 0.3): number {
  return base * randFloat(1 - spread, 1 + spread, rng);
}
