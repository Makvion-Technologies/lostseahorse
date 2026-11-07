import type { ResultRow, RoomSettings } from "@/lib/party/events";
import {
  buildRunStats,
  closeRunMarks,
  recordKeyMarks,
  type ChartMark,
  type GhostFrame,
  type ReplayEvent,
  type RunStats,
  type WpmSample,
} from "@/lib/runStats";
import { applyKey, createEngine, typedWordsOf } from "@/lib/typing";
import { calcWpm } from "@/lib/wpm";

/**
 * Rebuild a racer's full run (graph, marks, replay, words) from the
 * keystrokes the race server logged. Works the same for every racer.
 * Returns null when the server sent no keystrokes (older server, flagged).
 */
export function racerStats(
  row: ResultRow,
  passage: string,
  settings: RoomSettings,
): RunStats | null {
  try {
    return rebuild(row, passage, settings);
  } catch {
    // Bad or partial data must never break the results page.
    return null;
  }
}

function rebuild(
  row: ResultRow,
  passage: string,
  settings: RoomSettings,
): RunStats | null {
  if (!Array.isArray(row.keys) || !row.keys.length || !passage) return null;
  const engine = createEngine(passage);
  const elapsed = Number.isFinite(row.elapsed) ? row.elapsed : settings.time;
  let marks: ChartMark[] = [];
  const ghost: GhostFrame[] = [];
  const replay: ReplayEvent[] = [];
  const samples: WpmSample[] = [];
  let second = 1;
  const sampleUpTo = (t: number) => {
    while (second <= t && second < elapsed) {
      samples.push({
        t: second,
        wpm: calcWpm(engine.netChars, second / 60),
        raw: calcWpm(engine.totalChars, second / 60),
      });
      second += 1;
    }
  };
  for (const entry of row.keys) {
    if (!Array.isArray(entry)) continue;
    const [ms, raw] = entry;
    if (typeof ms !== "number" || typeof raw !== "string") continue;
    const t = ms / 1000;
    if (t > elapsed + 0.05) break;
    sampleUpTo(Math.floor(t));
    const key = raw === "\b" ? "Backspace" : raw;
    applyKey(engine, key);
    ghost.push({ t, word: engine.lifetimeWords, letter: engine.typed.length });
    replay.push({ t, key });
    marks = recordKeyMarks(marks, key, engine, t);
    if (engine.finished) break;
  }
  sampleUpTo(Math.floor(elapsed));
  samples.push({ t: elapsed, wpm: row.wpm, raw: row.rawWpm });
  const stats = buildRunStats({
    engine,
    elapsed,
    setTime: settings.time,
    goal: settings.goal === "words" ? "words" : "time",
    level: settings.level,
    extras: { punctuation: settings.punctuation === true, numbers: settings.numbers === true },
    source: "generated",
    finished: row.finished,
    samples,
    marks: closeRunMarks(marks, engine, elapsed),
    ghost,
    replayPassage: passage,
    replay,
    typedWords: typedWordsOf(engine),
  });
  // Server numbers are official (they set the podium).
  return { ...stats, wpm: row.wpm, rawWpm: row.rawWpm, accuracy: row.accuracy };
}
