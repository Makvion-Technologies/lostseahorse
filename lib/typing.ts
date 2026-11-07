export type KeyResult = "correct" | "error" | "backspace" | "ignore";

export type TypingEngine = {
  passage: string;
  words: string[];
  wordIndex: number;
  typed: string;
  committed: string[];
  index: number;
  errors: number;
  totalChars: number;
  correctChars: number;
  /** Chars that count toward net WPM: fully correct words + their spaces,
   * plus the current word's correct prefix. Partial matches inside a wrong
   * word don't count (standard net WPM). */
  netChars: number;
  finished: boolean;
  infinite?: boolean;
  lockedCorrect: number;
  lockedNet: number;
  /** Words dropped from the window in infinite mode, kept for results. */
  history: { expected: string; typed: string }[];
  lifetimeWords: number;
  resetKey?: number;
};

const EXTRA_CAP = 12;

const CHAR_MAP: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": "'",
  "\u201B": "'",
  "\u2032": "'",
  "\u00B4": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u201E": '"',
  "\u201F": '"',
  "\u2033": '"',
  "\u00AB": '"',
  "\u00BB": '"',
  "\u2010": "-",
  "\u2011": "-",
  "\u2012": "-",
  "\u2013": "-",
  "\u2014": "-",
  "\u2015": "-",
  "\u2212": "-",
  "\u2026": "...",
  "\u00A0": " ",
  "\u2007": " ",
  "\u202F": " ",
};

/**
 * Normalizes characters that browsers, OS keyboards (iOS/Android smart
 * punctuation, macOS substitutions) or pasted text may produce in a
 * different-but-equivalent form, so they always match the passage.
 */
export function normalizeTyped(text: string): string {
  let out = "";
  for (const ch of text.normalize("NFC")) out += CHAR_MAP[ch] ?? ch;
  return out;
}

export function createEngine(
  passage: string,
  resetKey?: number,
  infinite = false,
): TypingEngine {
  const words = normalizeTyped(passage).split(/\s+/).filter(Boolean);
  const engine: TypingEngine = {
    passage,
    words,
    wordIndex: 0,
    typed: "",
    committed: [],
    index: 0,
    errors: 0,
    totalChars: 0,
    correctChars: 0,
    netChars: 0,
    finished: !infinite && words.length === 0,
    infinite,
    lockedCorrect: 0,
    lockedNet: 0,
    history: [],
    lifetimeWords: 0,
    resetKey,
  };
  syncStats(engine);
  return engine;
}

export function applyKey(engine: TypingEngine, key: string): KeyResult {
  if (engine.finished) return "ignore";
  if (key === "\n" || key === "\r" || key === "\t") return "ignore";

  if (key === "Backspace") {
    if (engine.typed.length > 0) {
      engine.typed = engine.typed.slice(0, -1);
      syncStats(engine);
      return "backspace";
    }
    if (engine.wordIndex > 0) {
      const prev = engine.committed[engine.committed.length - 1] ?? "";
      engine.committed = engine.committed.slice(0, -1);
      engine.wordIndex -= 1;
      engine.typed = prev;
      engine.lifetimeWords = Math.max(0, engine.lifetimeWords - 1);
      engine.finished = false;
      syncStats(engine);
      return "backspace";
    }
    return "ignore";
  }

  if (key.length !== 1) return "ignore";

  if (key === " ") {
    if (engine.typed.length === 0) return "ignore";
    if (engine.wordIndex >= engine.words.length) return "ignore";
    engine.totalChars += 1;
    engine.committed = [...engine.committed, engine.typed];
    engine.typed = "";
    engine.wordIndex += 1;
    engine.lifetimeWords += 1;
    if (!engine.infinite && engine.wordIndex >= engine.words.length) {
      engine.finished = true;
    }
    syncStats(engine);
    return "correct";
  }

  const word = engine.words[engine.wordIndex];
  if (!word) return "ignore";
  if (engine.typed.length >= word.length + EXTRA_CAP) return "ignore";

  engine.totalChars += 1;
  const pos = engine.typed.length;
  engine.typed += key;
  const ok = pos < word.length && word[pos] === key;
  if (!ok) engine.errors += 1;

  if (engine.typed === word && engine.wordIndex === engine.words.length - 1) {
    engine.committed = [...engine.committed, engine.typed];
    engine.typed = "";
    engine.wordIndex += 1;
    engine.lifetimeWords += 1;
    if (!engine.infinite) engine.finished = true;
  }

  syncStats(engine);
  return ok ? "correct" : "error";
}

export function expectedChar(engine: TypingEngine): string | null {
  if (engine.finished) return null;
  const word = engine.words[engine.wordIndex];
  if (!word) return null;
  if (engine.typed.length < word.length) return word[engine.typed.length] ?? null;
  if (engine.wordIndex < engine.words.length - 1) return " ";
  return null;
}

export function wordsRemaining(engine: TypingEngine): number {
  return Math.max(0, engine.words.length - engine.wordIndex);
}

export function progressOf(engine: TypingEngine): number {
  if (engine.infinite) {
    return Math.min(0.98, engine.lifetimeWords / 50);
  }
  if (!engine.passage.length) return 0;
  return Math.min(1, engine.index / engine.passage.length);
}

export function appendWords(engine: TypingEngine, next: string[]) {
  if (!next.length) return;
  engine.words = engine.words.concat(next.map((word) => normalizeTyped(word)));
}

export function dropPrefix(engine: TypingEngine, count: number) {
  const n = Math.min(count, engine.wordIndex, engine.committed.length);
  if (n <= 0) return;
  for (let i = 0; i < n; i++) {
    const expected = engine.words[i] ?? "";
    const typed = engine.committed[i] ?? "";
    engine.lockedCorrect += matchedChars(expected, typed);
    if (typed === expected) {
      engine.lockedCorrect += 1;
      engine.lockedNet += expected.length + 1;
    }
  }
  engine.history = [
    ...engine.history,
    ...engine.words
      .slice(0, n)
      .map((expected, i) => ({ expected, typed: engine.committed[i] ?? "" })),
  ];
  engine.words = engine.words.slice(n);
  engine.committed = engine.committed.slice(n);
  engine.wordIndex -= n;
  syncStats(engine);
}

export function splitWords(passage: string): { text: string; start: number; end: number }[] {
  const words: { text: string; start: number; end: number }[] = [];
  let start = 0;
  for (let i = 0; i <= passage.length; i++) {
    if (i === passage.length || passage[i] === " ") {
      if (i > start) {
        words.push({ text: passage.slice(start, i), start, end: i });
      }
      start = i + 1;
    }
  }
  return words;
}

function syncStats(engine: TypingEngine) {
  let index = 0;
  let correct = engine.lockedCorrect;
  let net = engine.lockedNet;
  for (let i = 0; i < engine.wordIndex; i++) {
    const expected = engine.words[i] ?? "";
    const typed = engine.committed[i] ?? "";
    index += expected.length + (i < engine.words.length - 1 ? 1 : 0);
    correct += matchedChars(expected, typed);
    if (i < engine.words.length - 1 && typed === expected) correct += 1;
    if (typed === expected) {
      net += expected.length + (i < engine.words.length - 1 ? 1 : 0);
    }
  }
  const current = engine.words[engine.wordIndex] ?? "";
  index += engine.typed.length;
  correct += matchedChars(current, engine.typed);
  if (current.startsWith(engine.typed)) net += engine.typed.length;
  engine.index = index;
  engine.correctChars = correct;
  engine.netChars = net;
}

function matchedChars(expected: string, typed: string): number {
  const n = Math.min(expected.length, typed.length);
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (expected[i] === typed[i]) count += 1;
  }
  return count;
}

/** Every word the user typed this run, in order (incl. infinite-mode history
 * and the in-progress word). */
export function typedWordsOf(
  engine: TypingEngine,
): { expected: string; typed: string }[] {
  const words = [...engine.history];
  for (let i = 0; i < engine.wordIndex; i++) {
    words.push({
      expected: engine.words[i] ?? "",
      typed: engine.committed[i] ?? "",
    });
  }
  if (engine.typed.length > 0) {
    words.push({
      expected: engine.words[engine.wordIndex] ?? "",
      typed: engine.typed,
    });
  }
  return words;
}
