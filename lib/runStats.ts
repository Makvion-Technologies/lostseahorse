import { typedWordsOf, type TypingEngine } from "@/lib/typing";
import { calcAccuracy, calcWpm } from "@/lib/wpm";
import type { GoalMode, Level } from "@/lib/types";

/** `raw` = raw WPM (every typed char, errors included) at time `t`. */
export type WpmSample = { t: number; wpm: number; raw?: number };

export type GhostFrame = {
  t: number;
  word: number;
  letter: number;
};

export type ReplayEvent = {
  t: number;
  key: string;
};

export type TypedWord = {
  expected: string;
  typed: string;
};

export function ghostAt(frames: GhostFrame[], t: number): GhostFrame {
  if (!frames.length) return { t: 0, word: 0, letter: 0 };
  if (t <= frames[0]!.t) return frames[0]!;
  for (let i = 1; i < frames.length; i++) {
    if (t < frames[i]!.t) return frames[i - 1]!;
  }
  return frames[frames.length - 1]!;
}

export function ghostSpan(
  frames: GhostFrame[],
  t: number,
): { a: GhostFrame; b: GhostFrame; u: number } {
  const zero = { t: 0, word: 0, letter: 0 };
  if (!frames.length) return { a: zero, b: zero, u: 0 };
  if (t <= frames[0]!.t) return { a: frames[0]!, b: frames[0]!, u: 0 };
  for (let i = 1; i < frames.length; i++) {
    if (t <= frames[i]!.t) {
      const a = frames[i - 1]!;
      const b = frames[i]!;
      const span = b.t - a.t;
      return { a, b, u: span <= 0 ? 1 : (t - a.t) / span };
    }
  }
  const last = frames[frames.length - 1]!;
  return { a: last, b: last, u: 1 };
}

export function ghostOffset(
  words: string[],
  word: number,
  letter: number,
): number {
  let offset = 0;
  const last = Math.min(Math.max(word, 0), words.length);
  for (let i = 0; i < last; i++) offset += (words[i]?.length ?? 0) + 1;
  return offset + Math.max(0, letter);
}

export function ghostFromOffset(
  words: string[],
  offset: number,
): { word: number; letter: number; frac: number } {
  let rest = Math.max(0, offset);
  for (let i = 0; i < words.length; i++) {
    const len = words[i]!.length;
    if (rest < len) {
      const letter = Math.floor(rest);
      return { word: i, letter, frac: rest - letter };
    }
    rest -= len;
    if (rest < 1) {
      return { word: i, letter: len, frac: rest };
    }
    rest -= 1;
  }
  const last = Math.max(0, words.length - 1);
  return { word: last, letter: words[last]?.length ?? 0, frac: 0 };
}

export function ghostPlayhead(
  frames: GhostFrame[],
  words: string[],
  t: number,
): { word: number; letter: number; frac: number } {
  if (!frames.length || !words.length) {
    return { word: 0, letter: 0, frac: 0 };
  }
  const last = frames[frames.length - 1]!;
  const totalT = Math.max(last.t, 0.001);
  const totalOff = ghostOffset(words, last.word, last.letter);
  const off = Math.min(totalOff, (Math.max(0, t) / totalT) * totalOff);
  return ghostFromOffset(words, off);
}

export type ChartMark = {
  t: number;
  wpm: number;
  expected: string;
  typed: string;
  kind: "error" | "missed";
  wordKey: number;
  at?: number;
};

export function fillWordMarks(
  marks: ChartMark[],
  wordKey: number,
  expected: string,
  typed: string,
): ChartMark[] {
  return marks.map((mark) =>
    mark.wordKey === wordKey ? { ...mark, expected, typed } : mark,
  );
}

export function wordMarks(
  t: number,
  wpm: number,
  expected: string,
  typed: string,
  wordKey: number,
): ChartMark[] {
  const marks: ChartMark[] = [];
  let error = typed.length > expected.length;
  const n = Math.min(expected.length, typed.length);
  for (let i = 0; i < n; i++) {
    if (typed[i] !== expected[i]) error = true;
  }
  if (error) {
    let at = 0;
    for (let i = 0; i < n; i++) {
      if (typed[i] !== expected[i]) {
        at = i;
        break;
      }
    }
    if (typed.length > expected.length) at = expected.length;
    marks.push({ t, wpm, expected, typed, kind: "error", wordKey, at });
  }
  if (typed.length < expected.length) {
    marks.push({
      t,
      wpm,
      expected,
      typed,
      kind: "missed",
      wordKey,
      at: typed.length,
    });
  }
  return marks;
}

export type RunStats = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  elapsed: number;
  setTime: number;
  goal: GoalMode;
  level: Level;
  extras: { punctuation: boolean; numbers: boolean };
  source: "generated" | "custom";
  words: number;
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  totalChars: number;
  errors: number;
  consistency: number;
  finished: boolean;
  samples: WpmSample[];
  marks: ChartMark[];
  ghost: GhostFrame[];
  replayPassage: string;
  replay: ReplayEvent[];
  typedWords: TypedWord[];
};

export function charBreakdown(engine: TypingEngine) {
  let extra = 0;
  let missed = 0;
  let incorrect = 0;

  const score = (expected: string, typed: string, inProgress = false) => {
    extra += Math.max(0, typed.length - expected.length);
    // The word still being typed when time ran out isn't "missed" yet.
    if (!inProgress) missed += Math.max(0, expected.length - typed.length);
    const n = Math.min(expected.length, typed.length);
    for (let i = 0; i < n; i++) {
      if (expected[i] !== typed[i]) incorrect += 1;
    }
  };

  const words = typedWordsOf(engine);
  const live = engine.typed.length > 0 ? words.length - 1 : -1;
  words.forEach((word, i) => score(word.expected, word.typed, i === live));

  return { extra, missed, incorrect, correct: engine.correctChars };
}

export function calcConsistency(samples: WpmSample[]): number {
  if (samples.length < 2) return 100;
  const values = samples.map((sample) => sample.wpm);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean <= 0) return 100;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.round((1 - Math.min(1, cv)) * 1000) / 10);
}

export function buildRunStats(opts: {
  engine: TypingEngine;
  elapsed: number;
  setTime: number;
  goal: GoalMode;
  level: Level;
  extras: { punctuation: boolean; numbers: boolean };
  source: "generated" | "custom";
  finished: boolean;
  samples: WpmSample[];
  marks: ChartMark[];
  ghost: GhostFrame[];
  replayPassage: string;
  replay: ReplayEvent[];
  typedWords: TypedWord[];
}): RunStats {
  const minutes = Math.max(opts.elapsed / 60, 1 / 60);
  const parts = charBreakdown(opts.engine);
  return {
    wpm: calcWpm(opts.engine.netChars, minutes),
    rawWpm: calcWpm(opts.engine.totalChars, minutes),
    accuracy: calcAccuracy(opts.engine.correctChars, opts.engine.totalChars),
    elapsed: opts.elapsed,
    setTime: opts.setTime,
    goal: opts.goal,
    level: opts.level,
    extras: opts.extras,
    source: opts.source,
    words: opts.engine.lifetimeWords,
    correct: parts.correct,
    incorrect: parts.incorrect,
    extra: parts.extra,
    missed: parts.missed,
    totalChars: opts.engine.totalChars,
    errors: opts.engine.errors,
    consistency: calcConsistency(opts.samples),
    finished: opts.finished,
    samples: opts.samples,
    marks: opts.marks,
    ghost: opts.ghost,
    replayPassage: opts.replayPassage,
    replay: opts.replay,
    typedWords: opts.typedWords,
  };
}

/**
 * Chart marks for one keystroke (errors as they happen, missed letters when a
 * word is skipped). Shared by Solo and Strangers so both graphs match.
 */
export function recordKeyMarks(
  marks: ChartMark[],
  key: string,
  engine: TypingEngine,
  t: number,
): ChartMark[] {
  const wpm = calcWpm(engine.netChars, t / 60);
  if (key === " ") {
    const index = engine.wordIndex - 1;
    if (index < 0) return marks;
    const expected = engine.words[index] ?? "";
    const typed = engine.committed[index] ?? "";
    const wordKey = engine.lifetimeWords - 1;
    const next = fillWordMarks(marks, wordKey, expected, typed);
    if (typed.length < expected.length) {
      next.push({
        t,
        wpm,
        expected,
        typed,
        kind: "missed",
        wordKey,
        at: typed.length,
      });
    }
    return next;
  }
  if (key.length !== 1) return marks;
  const expectedWord = engine.words[engine.wordIndex] ?? "";
  const typed = engine.typed;
  const pos = typed.length - 1;
  if (typed[pos] !== expectedWord[pos]) {
    marks.push({
      t,
      wpm,
      expected: expectedWord,
      typed,
      kind: "error",
      wordKey: engine.lifetimeWords,
      at: pos,
    });
  }
  return marks;
}

/** Marks for the word still in progress when the run ends. */
export function closeRunMarks(
  marks: ChartMark[],
  engine: TypingEngine,
  elapsed: number,
): ChartMark[] {
  if (engine.typed.length === 0) return marks;
  const wpmNow = calcWpm(engine.netChars, elapsed / 60);
  const expected = engine.words[engine.wordIndex] ?? "";
  const typed = engine.typed;
  const wordKey = engine.lifetimeWords;
  const next = fillWordMarks(marks, wordKey, expected, typed);
  if (next.some((mark) => mark.wordKey === wordKey)) return next;
  return [...next, ...wordMarks(elapsed, wpmNow, expected, typed, wordKey)];
}
