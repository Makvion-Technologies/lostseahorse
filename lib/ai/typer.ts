import type { Level } from "../types";
import { randFloat } from "../rng";

export type Stroke =
  | { kind: "char"; wait: number }
  | { kind: "stall"; wait: number };

export function targetWpm(homeWpm: number, rng: () => number): number {
  return homeWpm * randFloat(0.92, 1.08, rng);
}

export function buildStrokes(opts: {
  passage: string;
  targetWpm: number;
  level: Level;
  rng: () => number;
}): Stroke[] {
  const baseMs = 60000 / Math.max(8, opts.targetWpm * 5);
  const typoChance =
    opts.level === "easy" ? 0.02 : opts.level === "medium" ? 0.06 : 0.09;
  const strokes: Stroke[] = [];
  const { passage, rng } = opts;

  for (let i = 0; i < passage.length; i++) {
    const char = passage[i]!;
    const punct = /[.,!?;:]/.test(char);
    let wait = baseMs * randFloat(0.7, 1.4, rng);
    if (punct) wait += randFloat(80, 200, rng);
    if (char === " ") wait *= randFloat(0.85, 1.25, rng);
    if (i > passage.length - 8) wait *= 1.35;

    if (rng() < typoChance) {
      strokes.push({ kind: "stall", wait: wait * 0.7 });
      strokes.push({ kind: "stall", wait: wait * 0.55 });
    }

    strokes.push({ kind: "char", wait });
  }

  return strokes;
}
