import type { Level } from "./types";
import easy from "../public/words/easy.json";
import medium from "../public/words/medium.json";
import hard from "../public/words/hard.json";

const LISTS: Record<Level, string[]> = {
  easy: easy as string[],
  medium: medium as string[],
  hard: hard as string[],
};

export function wordsFor(level: Level): string[] {
  return LISTS[level];
}

export function allWordLists() {
  return LISTS;
}
