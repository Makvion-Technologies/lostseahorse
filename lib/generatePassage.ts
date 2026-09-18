import type { Level, TimeLimit } from "./types";
import { pick, randFloat } from "./rng";
import { allWordLists, wordsFor } from "./words";

const TARGET_CHARS: Record<number, Record<Level, number>> = {
  15: { easy: 90, medium: 110, hard: 120 },
  30: { easy: 180, medium: 220, hard: 240 },
  60: { easy: 320, medium: 360, hard: 400 },
  120: { easy: 400, medium: 400, hard: 400 },
};

const HARD_PUNCT = [",", ".", "?", "!", ";"] as const;
const MAX_CHARS = 400;

function decorateHard(word: string, rng: () => number): string {
  if (word.includes("'") || word.includes("-")) return word;
  if (rng() > 0.18) return word;
  return word + pick(HARD_PUNCT, rng);
}

function pickWord(level: Level, rng: () => number): string {
  const lists = allWordLists();
  if (level === "easy") return pick(lists.easy, rng);
  if (level === "medium") {
    return rng() < 0.45 ? pick(lists.easy, rng) : pick(lists.medium, rng);
  }
  const roll = rng();
  if (roll < 0.12) return pick(lists.easy, rng);
  if (roll < 0.35) return pick(lists.medium, rng);
  return decorateHard(pick(lists.hard, rng), rng);
}

export function generateWords(opts: {
  level: Level;
  count: number;
  rng: () => number;
}): string[] {
  const words: string[] = [];
  const target = Math.max(1, opts.count);
  while (words.length < target) {
    words.push(pickWord(opts.level, opts.rng));
  }
  return words;
}

export function generatePassage(opts: {
  level: Level;
  time: TimeLimit;
  rng: () => number;
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
    const word = pickWord(opts.level, opts.rng);
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
