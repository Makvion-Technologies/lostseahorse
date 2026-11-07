import { Server, getServerByName } from "partyserver";
import type { Env } from "./env";
import {
  PROFILE_ID_RE,
  RENAME_COOLDOWN_MS,
  RENAME_MAX_PER_WINDOW,
  RENAME_WINDOW_MS,
  waitLabel,
  nameKey,
  nameProblem,
  type Profile,
} from "../lib/profileName";
import { MAX_PLAUSIBLE_WPM } from "../lib/party/events";
import { clientIp, internalUrl, isInternal } from "./origin";
import {
  BOARD_KEEP,
  BOARD_SHOW,
  isBoardLength,
  isBoardLevel,
  rankBoard,
  botBoardId,
  GLOBAL_BOARD,
  rerank,
  type Board,
  type LeaderRow,
  type LeaderboardResponse,
} from "../lib/leaderboard";

/**
 * Player profiles keyed by a random device id. One room ("registry") holds
 * everything so the name index is a single source of truth:
 *   p:<id>   -> Profile
 *   n:<name> -> id   (lowercased; enforces case-insensitive uniqueness)
 *   lb:all   -> Board    (best Strangers WPM per racer, every length/level)
 */
export const PROFILE_ROOM = "registry";

const WINDOW_MS = 60_000;
const MAX_WRITES = 10;
const MAX_READS = 120;

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  return {
    "access-control-allow-origin": origin || "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "origin",
  };
}

export class Profiles extends Server<Env> {
  static options = { hibernate: false };
  hits = new Map<string, number[]>();
  /** Serialises writes so two claims of one name can't interleave. */
  lock: Promise<unknown> = Promise.resolve();

  async onRequest(req: Request): Promise<Response> {
    const headers = { ...cors(req), "content-type": "application/json" };
    const reply = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), { status, headers });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");
    const internal = isInternal(req);
    const ip = clientIp(req);

    if (req.method === "GET") {
      if (!internal && !this.allow(`r:${ip}`, MAX_READS)) return reply({ error: "Slow down." }, 429);
      if (path.endsWith("/me")) {
        const id = url.searchParams.get("id") ?? "";
        if (!PROFILE_ID_RE.test(id)) return reply({ error: "Bad id." }, 400);
        return reply({ profile: (await this.get(id)) ?? null });
      }
      if (path.endsWith("/leaderboard")) {
        return reply(await this.leaderboard(url.searchParams.get("id") ?? ""));
      }
      if (path.endsWith("/check")) {
        const name = url.searchParams.get("name") ?? "";
        const id = url.searchParams.get("id") ?? "";
        const problem = nameProblem(name);
        if (problem) return reply({ available: false, reason: problem });
        const owner = await this.ctx.storage.get<string>(`n:${nameKey(name)}`);
        const available = !owner || owner === id;
        return reply({ available, reason: available ? null : "That name is taken." });
      }
      return reply({ error: "Not found" }, 404);
    }

    if (req.method !== "POST") return reply({ error: "Not found" }, 404);
    let body: Record<string, unknown>;
    try {
      const text = await req.text();
      if (text.length > 2000) return reply({ error: "Too large." }, 413);
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return reply({ error: "Bad JSON." }, 400);
    }

    if (path.endsWith("/stats")) {
      if (!internal) return reply({ error: "Forbidden" }, 403);
      return this.serial(async () => reply(await this.recordStats(body)));
    }

    if (path.endsWith("/name")) {
      if (!internal && !this.allow(`w:${ip}`, MAX_WRITES)) return reply({ error: "Slow down." }, 429);
      return this.serial(async () => {
        const result = await this.claimName(body.id, body.name);
        return "error" in result ? reply(result, 409) : reply(result);
      });
    }
    return reply({ error: "Not found" }, 404);
  }

  private async claimName(rawId: unknown, rawName: unknown): Promise<{ profile: Profile } | { error: string }> {
    if (typeof rawId !== "string" || !PROFILE_ID_RE.test(rawId)) return { error: "Bad id." };
    const problem = nameProblem(rawName);
    if (problem) return { error: problem };
    const name = (rawName as string).trim();
    const key = nameKey(name);
    const existing = await this.get(rawId);

    if (existing && existing.name === name) return { profile: existing };
    const owner = await this.ctx.storage.get<string>(`n:${key}`);
    if (owner && owner !== rawId) return { error: "That name is taken." };

    if (!existing) {
      const profile: Profile = {
        id: rawId,
        name,
        createdAt: Date.now(),
        stats: { races: 0, bestWpm: 0, lastWpm: 0 },
      };
      await this.ctx.storage.put({ [`p:${rawId}`]: profile, [`n:${key}`]: rawId });
      return { profile };
    }

    // Renames are unlimited but rate-limited (case-only tweaks are free):
    // a cooldown between changes plus a rolling cap per 24h, against spam.
    const caseOnly = nameKey(existing.name) === key;
    const now = Date.now();
    const recent = (existing.renames ?? []).filter((t) => now - t < RENAME_WINDOW_MS);
    if (!caseOnly) {
      const last = recent.length ? Math.max(...recent) : 0;
      if (now - last < RENAME_COOLDOWN_MS) {
        return { error: `Just renamed. Try again in ${waitLabel(RENAME_COOLDOWN_MS - (now - last))}.` };
      }
      if (recent.length >= RENAME_MAX_PER_WINDOW) {
        const oldest = Math.min(...recent);
        return { error: `Name change limit reached. Try again in ${waitLabel(RENAME_WINDOW_MS - (now - oldest))}.` };
      }
    }
    // Drop the legacy one-change counter; the leaderboard is keyed by id, so
    // best WPM and rank follow the new name.
    const { nameChanges: _legacy, ...rest } = existing as Profile & { nameChanges?: number };
    void _legacy;
    const profile: Profile = {
      ...rest,
      name,
      renames: caseOnly ? recent : [...recent, now],
    };
    if (!caseOnly) await this.ctx.storage.delete(`n:${nameKey(existing.name)}`);
    await this.ctx.storage.put({ [`p:${rawId}`]: profile, [`n:${key}`]: rawId });
    return { profile };
  }

  private async recordStats(body: Record<string, unknown>) {
    // Bot racer: no profile, only its real result on the board.
    if (typeof body.bot === "string") {
      const name = body.bot.trim().slice(0, 24);
      const wpm = Number(body.wpm);
      const board = body.board as { length?: unknown; level?: unknown; acc?: unknown } | undefined;
      if (!name || !Number.isFinite(wpm) || wpm <= 0 || wpm > MAX_PLAUSIBLE_WPM) return { ok: false };
      if (!board || !isBoardLength(board.length) || !isBoardLevel(board.level)) return { ok: false };
      await this.recordBoard(GLOBAL_BOARD, botBoardId(name), wpm, Number(board.acc), name);
      return { ok: true };
    }
    const id = body.id;
    const wpm = Number(body.wpm);
    if (typeof id !== "string" || !PROFILE_ID_RE.test(id)) return { ok: false };
    if (!Number.isFinite(wpm) || wpm < 0 || wpm > MAX_PLAUSIBLE_WPM) return { ok: false };
    const profile = await this.get(id);
    if (!profile) return { ok: false };
    const stats = {
      races: profile.stats.races + 1,
      bestWpm: Math.max(profile.stats.bestWpm, Math.round(wpm)),
      lastWpm: Math.round(wpm),
    };
    await this.ctx.storage.put(`p:${id}`, { ...profile, stats });
    const board = body.board as { length?: unknown; level?: unknown; acc?: unknown } | undefined;
    if (board && isBoardLength(board.length) && isBoardLevel(board.level)) {
      await this.recordBoard(GLOBAL_BOARD, id, wpm, Number(board.acc));
    }
    return { ok: true };
  }

  /**
   * One-time fold of pre-leaderboard history: each profile's stored best WPM
   * (a real race result) joins lb:all. No accuracy was kept then, so acc = 0
   * (ranks below an equal score set later); "at" is the profile's creation.
   * Idempotent via the mig:legacy-best flag; never lowers a better entry.
   */
  private async migrateLegacy() {
    if (await this.ctx.storage.get("mig:legacy-best")) return;
    const board = (await this.ctx.storage.get<Board>(`lb:${GLOBAL_BOARD}`)) ?? {};
    const profiles = await this.ctx.storage.list<Profile>({ prefix: "p:" });
    for (const p of profiles.values()) {
      const best = p.stats?.bestWpm ?? 0;
      if (!(p.stats?.races > 0) || !(best > 0) || best > MAX_PLAUSIBLE_WPM) continue;
      const prev = board[p.id];
      if (prev && prev.wpm >= best) continue;
      board[p.id] = { wpm: best, acc: 0, at: p.createdAt ?? Date.now() };
    }
    for (const drop of rerank(board, null).slice(BOARD_KEEP)) delete board[drop];
    await this.ctx.storage.put({ [`lb:${GLOBAL_BOARD}`]: board, "mig:legacy-best": Date.now() });
  }

  private async recordBoard(key: string, id: string, wpm: number, rawAcc: number, botName?: string) {
    await this.migrateLegacy();
    const board = (await this.ctx.storage.get<Board>(`lb:${key}`)) ?? {};
    const acc = Number.isFinite(rawAcc) ? Math.max(0, Math.min(100, rawAcc)) : 0;
    const prev = board[id];
    const score = Math.round(wpm * 100) / 100;
    if (prev && (prev.wpm > score || (prev.wpm === score && prev.acc >= acc))) return;
    // Keep rank/move so an improvement is measured from where they stood.
    const kept = prev ? { rank: prev.rank, move: prev.move } : {};
    board[id] = botName
      ? { wpm: score, acc: Math.round(acc * 10) / 10, at: Date.now(), name: botName, isBot: true, ...kept }
      : { wpm: score, acc: Math.round(acc * 10) / 10, at: Date.now(), ...kept };
    const order = rerank(board, prev ? null : id);
    for (const drop of order.slice(BOARD_KEEP)) delete board[drop];
    await this.ctx.storage.put(`lb:${key}`, board);
  }

  private async leaderboard(you: string) {
    await this.migrateLegacy();
    const key = GLOBAL_BOARD;
    const board = (await this.ctx.storage.get<Board>(`lb:${key}`)) ?? {};
    const order = rankBoard(board);
    const shown = order.slice(0, BOARD_SHOW);
    const youRank = order.indexOf(you) + 1;
    const ids = youRank > BOARD_SHOW ? [...shown, you] : shown;
    const profiles = new Map<string, Profile>();
    for (let i = 0; i < ids.length; i += 100) {
      const got = await this.ctx.storage.get<Profile>(ids.slice(i, i + 100).map((id) => `p:${id}`));
      for (const p of got.values()) profiles.set(p.id, p);
    }
    const row = (id: string, rank: number): LeaderRow => {
      const e = board[id]!;
      return {
        rank,
        id,
        name: profiles.get(id)?.name ?? e.name ?? "racer",
        wpm: Math.round(e.wpm),
        acc: e.acc,
        move: e.rank === undefined ? 0 : (e.move ?? null),
      };
    };
    const body: LeaderboardResponse = {
      total: order.length,
      rows: shown.map((id, i) => row(id, i + 1)),
      you: youRank > BOARD_SHOW ? row(you, youRank) : null,
    };
    return body;
  }

  private get(id: string) {
    return this.ctx.storage.get<Profile>(`p:${id}`);
  }

  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.lock.then(fn, fn);
    this.lock = run.catch(() => undefined);
    return run;
  }

  private allow(key: string, max: number): boolean {
    const now = Date.now();
    const prev = (this.hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    if (prev.length >= max) {
      this.hits.set(key, prev);
      return false;
    }
    prev.push(now);
    this.hits.set(key, prev);
    return true;
  }
}

/** Party-to-party lookup used by the matchmaker and race rooms. */
export async function lookupProfile(env: Env, id: unknown): Promise<Profile | null> {
  if (typeof id !== "string" || !PROFILE_ID_RE.test(id)) return null;
  try {
    const res = await profilesStub(env).fetch(`/me?id=${encodeURIComponent(id)}`, {
      headers: { "x-lostseahorse-internal": "1" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { profile?: Profile | null };
    return data.profile ?? null;
  } catch {
    return null;
  }
}

/** Party-to-party client for the registry: fetch(path) on the Profiles Durable Object. */
export type ProfilesStub = { fetch(path: string, init?: RequestInit): Promise<Response> };

export function profilesStub(env: Env): ProfilesStub {
  return {
    async fetch(path, init) {
      const stub = await getServerByName(env.Profiles, PROFILE_ROOM);
      return stub.fetch(internalUrl("profiles", PROFILE_ROOM, path), init);
    },
  };
}

export async function recordProfileStats(
  stub: ProfilesStub | null,
  id: string,
  wpm: number,
  board?: { length: string; level: string; acc: number },
) {
  try {
    if (!stub) return;
    await stub.fetch("/stats", {
      method: "POST",
      headers: { "content-type": "application/json", "x-lostseahorse-internal": "1" },
      body: JSON.stringify({ id, wpm, board }),
    });
  } catch {
    /* stats are best effort */
  }
}

/** A bot racer's real result, onto the board under its name. */
export async function recordBotBoard(
  stub: ProfilesStub | null,
  name: string,
  wpm: number,
  board: { length: string; level: string; acc: number },
) {
  try {
    if (!stub) return;
    await stub.fetch("/stats", {
      method: "POST",
      headers: { "content-type": "application/json", "x-lostseahorse-internal": "1" },
      body: JSON.stringify({ bot: name, wpm, board }),
    });
  } catch {
    /* best effort */
  }
}
