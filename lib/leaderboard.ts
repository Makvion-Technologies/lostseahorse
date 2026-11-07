import { LEVELS, type Level } from "./types";

/** Same lengths as Strangers (kept here so the server needn't load client code). */
export const BOARD_LENGTHS = ["15", "30", "60", "120"] as const;
export type BoardLength = (typeof BOARD_LENGTHS)[number];

/**
 * Strangers leaderboard: one global board across all lengths and levels.
 *
 * Ranking: each racer's best net WPM in any timed Strangers race. Ties go to higher accuracy, then whoever set it first.
 *
 * Movement is live: on every board change, anyone whose rank changed gets
 * move = old rank - new rank. It sticks until their rank changes again, so a
 * jump stays visible. A brand-new entry is "new" until its rank first changes.
 */
/** Bot racers' real results count too, keyed `bot:<name>`; isBot stays internal. */
export type BoardEntry = {
  wpm: number;
  acc: number;
  at: number;
  name?: string;
  isBot?: boolean;
  /** Rank after the last board change (absent on entries from before live movement). */
  rank?: number;
  /** Places gained at the entry's last rank change; null = new. */
  move?: number | null;
};
export type Board = Record<string, BoardEntry>;

/**
 * Re-rank after a change: refresh each entry's rank and, where it changed, its
 * move. `added` is the id that just joined (shown as new). Mutates and returns order.
 */
export function rerank(board: Board, added: string | null): string[] {
  const order = rankBoard(board);
  order.forEach((id, i) => {
    const e = board[id]!;
    const rank = i + 1;
    if (id === added) {
      e.rank = rank;
      e.move = null;
    } else if (e.rank === undefined) {
      // Entry from before live movement: start from here, no change yet.
      e.rank = rank;
      e.move = e.move ?? 0;
    } else if (e.rank !== rank) {
      e.move = e.rank - rank;
      e.rank = rank;
    }
  });
  return order;
}

export type LeaderRow = {
  rank: number;
  id: string;
  name: string;
  wpm: number;
  acc: number;
  /** Places gained at the last rank change; 0 = unchanged so far; null = new. */
  move: number | null;
};

export type LeaderboardResponse = {
  total: number;
  rows: LeaderRow[];
  /** Your row when you're on the board but outside the rows shown. */
  you: LeaderRow | null;
};

/** Board size kept in storage; rows shown to clients. */
export const BOARD_KEEP = 500;
export const BOARD_SHOW = 10;
/** One board for every timed Strangers race, whatever its length or level. */
export const GLOBAL_BOARD = "all";

export function boardKey(length: string, level: string) {
  return `${length}:${level}`;
}

export function isBoardLength(v: unknown): v is BoardLength {
  return typeof v === "string" && (BOARD_LENGTHS as readonly string[]).includes(v);
}

export function isBoardLevel(v: unknown): v is Level {
  return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}

/** Stable board id for a bot name, so a name keeps its best like a person. */
export function botBoardId(name: string) {
  return `bot:${name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 32)}`;
}

/** Ids best-first. */
export function rankBoard(board: Board): string[] {
  return Object.keys(board).sort((a, b) => {
    const x = board[a]!;
    const y = board[b]!;
    return y.wpm - x.wpm || y.acc - x.acc || x.at - y.at || (a < b ? -1 : 1);
  });
}

