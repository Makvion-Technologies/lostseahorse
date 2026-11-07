import { Server, type Connection } from "partyserver";
import type { Env } from "./env";
import { buildStrokes, targetWpm, type Stroke } from "../lib/ai/typer";
import { generatePassage, generateWords } from "../lib/generatePassage";
import {
  MAX_KEYS_PER_BATCH,
  MAX_KEY_LOG,
  type KeyLogEntry,
  MAX_KEYS_PER_SEC,
  MAX_MESSAGE_BYTES,
  MAX_PLAUSIBLE_WPM,
  FRIENDS_MAX,
  FRIENDS_MIN,
  ROOM_CAP,
  asRecord,
  parseJsonEvent,
  type PlayerPublic,
  type ResultRow,
  type RoomSettings,
  type RoomState,
  type RoomStatus,
  type ServerEvent,
  type SetupAi,
  type SetupPayload,
} from "../lib/party/events";
import { hashSeed, mulberry32 } from "../lib/rng";
import { isValidRoomCode } from "../lib/roomCode";
import { sanitizeName } from "../lib/names";
import {
  COLORS,
  isColorHex,
  isGameMode,
  isLevel,
  isStyleId,
  isTimeLimit,
  type ColorHex,
  type GameMode,
  type StyleId,
} from "../lib/types";
import {
  applyKey,
  createEngine,
  expectedChar,
  progressOf,
  type TypingEngine,
} from "../lib/typing";
import { calcAccuracy, calcWpm } from "../lib/wpm";
import { clientIp, isInternal, rateLimitCreate } from "./origin";
import { lookupProfile, profilesStub, recordBotBoard, recordProfileStats, type ProfilesStub } from "./profiles";
import { isBoardLength } from "../lib/leaderboard";

/** Stranger rooms: how long matched players get to connect. */
/** Clients hold the match reveal until 12s of searching, so leave room to arrive. */
const JOIN_WINDOW_MS = 25_000;
/** Stranger rooms: 3-2-1 before the clock starts. */
const COUNTDOWN_MS = 3_000;
const JOIN_WINDOW = 10_000;
const JOIN_MAX = 5;

type InternalPlayer = {
  id: string;
  connectionId?: string;
  name: string;
  style: StyleId;
  color: ColorHex;
  isAi: boolean;
  homeWpm?: number;
  engine: TypingEngine;
  connected: boolean;
  finishedAt: number | null;
  keyTimes: number[];
  /** Applied keystrokes for the results graph (see ResultRow.keys). */
  keyLog: KeyLogEntry[];
  /** When this racer last typed a correct key (tiebreak: earlier wins). */
  lastCorrectAt: number | null;
  /** Profile id (humans only), for stats. */
  pid?: string;
  lastProgressAt: number;
};

export class RaceRoom extends Server<Env> {
  static options = { hibernate: false };

  settings: RoomSettings = { time: 30, level: "easy" };
  mode: GameMode = "friends";
  status: RoomStatus = "lobby";
  passage = "";
  players = new Map<string, InternalPlayer>();
  hostId: string | null = null;
  fillAi = false;
  startedAt: number | null = null;
  endsAt: number | null = null;
  countdownEndsAt: number | null = null;
  autoStart = false;
  expectedHumans = 1;
  /** Friends rooms: hard cap on humans (set by the creator). */
  maxPlayers = FRIENDS_MAX;
  configured = false;
  alarmKind: "end" | "join" | "go" | null = null;
  joinTimes = new Map<string, number[]>();
  aiTimers: ReturnType<typeof setTimeout>[] = [];

  /** Cached room id (this.name), used everywhere below. */
  roomCode = "";
  /** Profiles registry client (timed races record stats from onAlarm). */
  profiles: ProfilesStub | null = null;

  async onRequest(req: Request) {
    this.roomCode = this.name;
    this.profiles ??= profilesStub(this.env);
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname.endsWith("/setup")) {
      if (!isInternal(req) && !rateLimitCreate(clientIp(req))) {
        return new Response("Slow down", { status: 429 });
      }
      const text = await req.text();
      if (text.length > 8000) return new Response("Too large", { status: 413 });
      let json: unknown;
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        return new Response("Bad JSON", { status: 400 });
      }
      const setup = parseSetup(json);
      if (!setup) return new Response("Invalid setup", { status: 400 });
      this.applySetup(setup);
      return new Response("ok");
    }
    return new Response("Not found", { status: 404 });
  }

  onConnect(connection: Connection) {
    this.roomCode = this.name;
    this.profiles ??= profilesStub(this.env);
    if (!isValidRoomCode(this.name) && this.name.length > 32) {
      connection.send(encode({ type: "error", message: "Invalid room." }));
      connection.close();
      return;
    }
    this.sendState(connection);
  }

  onMessage(sender: Connection, message: string | ArrayBuffer | ArrayBufferView) {
    if (typeof message !== "string") return;
    if (message.length > MAX_MESSAGE_BYTES) return;
    const parsed = parseJsonEvent(message);
    const data = asRecord(parsed);
    if (!data || typeof data.type !== "string") return;

    if (data.type === "join") void this.handleJoin(sender, data);
    else if (data.type === "start") this.handleStart(sender);
    else if (data.type === "again") this.handleAgain(sender);
    else if (data.type === "fillAi") this.handleFillAi(sender, data);
    else if (data.type === "typed") this.handleTyped(sender, data);
    else if (data.type === "finish") this.handleFinish(sender);
  }

  onClose(connection: Connection) {
    this.joinTimes.delete(connection.id);
    const player = this.findByConnection(connection.id);
    if (!player || player.isAi) return;
    player.connected = false;
    player.connectionId = undefined;
    if (this.status === "lobby") {
      this.players.delete(player.id);
    }
    // Host left: hand the room to the next racer still here.
    if (this.hostId === player.id) {
      this.hostId = this.firstHuman()?.id ?? null;
    }
    this.broadcastState();
  }

  async onAlarm() {
    this.roomCode ||= this.name;
    this.profiles ??= profilesStub(this.env);
    const kind = this.alarmKind;
    this.alarmKind = null;
    if (kind === "end" && this.status === "racing") {
      this.finishRace();
    } else if (kind === "join" && this.status === "lobby") {
      // Someone matched never showed up: race whoever is here.
      const humans = this.connectedHumans();
      if (humans.length === 0) return;
      if (humans.length === 1 && ![...this.players.values()].some((p) => p.isAi)) {
        this.fillAi = true;
      }
      this.beginCountdown();
    } else if (kind === "go" && this.status === "countdown") {
      this.go();
    }
  }

  private applySetup(setup: SetupPayload) {
    if (this.status !== "lobby") return;
    this.configured = true;
    this.mode = setup.mode;
    this.settings = setup.settings;
    this.autoStart = setup.autoStart;
    this.expectedHumans = setup.expectedHumans;
    this.fillAi = setup.fillAi;
    if (this.mode === "stranger" && this.autoStart) {
      this.alarmKind = "join";
      void this.ctx.storage.setAlarm(Date.now() + JOIN_WINDOW_MS);
    }
    for (const ai of [...(setup.ai ? [setup.ai] : []), ...(setup.ais ?? [])]) {
      if (this.players.has(ai.id) || this.players.size >= ROOM_CAP) continue;
      this.players.set(ai.id, {
        id: ai.id,
        name: sanitizeName(ai.name),
        style: ai.style,
        color: ai.color,
        isAi: true,
        homeWpm: ai.homeWpm,
        engine: createEngine(""),
        connected: true,
        finishedAt: null,
        keyTimes: [],
        keyLog: [],
        lastCorrectAt: null,
        lastProgressAt: 0,
      });
    }
    this.broadcastState();
  }

  private async handleJoin(sender: Connection, data: Record<string, unknown>) {
    const existing = this.findByConnection(sender.id);
    if (existing) {
      this.sendState(sender);
      return;
    }
    const nowJoin = Date.now();
    const tries = (this.joinTimes.get(sender.id) ?? []).filter((t) => nowJoin - t < JOIN_WINDOW);
    if (tries.length >= JOIN_MAX) return;
    tries.push(nowJoin);
    this.joinTimes.set(sender.id, tries);

    if (this.status !== "lobby") {
      sender.send(encode({ type: "error", message: "Race already moving." }));
      return;
    }

    const humans = [...this.players.values()].filter((p) => !p.isAi).length;
    const cap = this.mode === "stranger" && this.autoStart ? this.expectedHumans : this.capFor(data);
    if (humans >= cap) {
      sender.send(encode({ type: "error", message: "Room is full." }));
      return;
    }

    // Names come from the profile server, never from client text.
    const profile = await lookupProfile(this.env, data.pid);
    if (!profile) {
      sender.send(encode({ type: "error", message: "Pick your racer name first." }));
      return;
    }
    // State may have moved while we waited on the lookup.
    if (this.findByConnection(sender.id)) return;
    if (this.status !== "lobby") {
      sender.send(encode({ type: "error", message: "Race already moving." }));
      return;
    }
    if ([...this.players.values()].filter((p) => !p.isAi).length >= cap) {
      sender.send(encode({ type: "error", message: "Room is full." }));
      return;
    }
    if ([...this.players.values()].some((p) => p.pid === profile.id && p.connected)) {
      sender.send(encode({ type: "error", message: "You are already in this race in another tab." }));
      return;
    }
    const name = sanitizeName(profile.name, "racer");
    const style = isStyleId(data.style) ? data.style : "kelp";
    const color = isColorHex(data.color) ? data.color : COLORS[0];

    if (!this.configured) {
      const settings = parseSettings(data.settings);
      if (settings) this.settings = settings;
      if (isGameMode(data.mode)) this.mode = data.mode;
      if (typeof data.fillAi === "boolean") this.fillAi = data.fillAi;
      if (this.mode === "friends") {
        // No bots in friends rooms; the creator picks the room size.
        this.fillAi = false;
        if (typeof data.max === "number" && Number.isFinite(data.max)) {
          this.maxPlayers = Math.max(FRIENDS_MIN, Math.min(FRIENDS_MAX, Math.round(data.max)));
        }
      }
      this.configured = true;
    }

    const id = sender.id;
    const player: InternalPlayer = {
      id,
      connectionId: sender.id,
      name,
      style,
      color,
      isAi: false,
      engine: createEngine(""),
      connected: true,
      finishedAt: null,
      keyTimes: [],
      keyLog: [],
        lastCorrectAt: null,
      lastProgressAt: 0,
      pid: profile.id,
    };
    this.players.set(id, player);
    if (!this.hostId) this.hostId = id;

    this.broadcastState();
    this.maybeAutoStart();
  }

  private handleFillAi(sender: Connection, data: Record<string, unknown>) {
    const player = this.findByConnection(sender.id);
    if (!player || player.id !== this.hostId) return;
    if (this.status !== "lobby") return;
    this.fillAi = data.on === true;
    this.broadcastState();
  }

  private handleStart(sender: Connection) {
    const player = this.findByConnection(sender.id);
    if (!player || player.id !== this.hostId) return;
    if (this.status !== "lobby") return;
    if (this.mode === "friends") {
      // Friends: at least two racers, then the same 3-2-1 as Strangers.
      if (this.connectedHumans().length < FRIENDS_MIN) return;
      this.fillAi = false;
      this.beginCountdown();
      return;
    }
    this.startRace();
  }

  /** Friends rooms: anyone on the results screen can take the room back to its lobby. */
  private handleAgain(sender: Connection) {
    if (this.mode !== "friends" || this.status !== "results") return;
    const player = this.findByConnection(sender.id);
    if (!player) return;
    for (const [id, p] of this.players) {
      if (p.isAi || !p.connected) this.players.delete(id);
    }
    for (const p of this.players.values()) {
      p.engine = createEngine("");
      p.finishedAt = null;
      p.keyTimes = [];
      p.keyLog = [];
      p.lastCorrectAt = null;
      p.lastProgressAt = 0;
    }
    if (!this.hostId || !this.players.has(this.hostId)) this.hostId = this.firstHuman()?.id ?? null;
    this.status = "lobby";
    this.passage = "";
    this.startedAt = null;
    this.endsAt = null;
    this.countdownEndsAt = null;
    this.alarmKind = null;
    this.broadcastState();
  }

  /** Human cap for a join: friends rooms use the creator's size. */
  private capFor(data: Record<string, unknown>) {
    const mode = this.configured ? this.mode : isGameMode(data.mode) ? data.mode : this.mode;
    if (mode !== "friends") return ROOM_CAP;
    if (this.configured) return this.maxPlayers;
    return typeof data.max === "number" && Number.isFinite(data.max)
      ? Math.max(FRIENDS_MIN, Math.min(FRIENDS_MAX, Math.round(data.max)))
      : FRIENDS_MAX;
  }

  private handleTyped(sender: Connection, data: Record<string, unknown>) {
    if (this.status !== "racing") return;
    const player = this.findByConnection(sender.id);
    if (!player || player.isAi || !player.connected || player.engine.finished) return;
    if (typeof data.keys !== "string") return;
    const keys = data.keys.slice(0, MAX_KEYS_PER_BATCH);
    const now = Date.now();
    if ([...keys].some((char) => char !== "\b")) this.armClock(now);
    player.keyTimes = player.keyTimes.filter((t) => now - t < 1000);
    for (const char of keys) {
      if (player.keyTimes.length >= MAX_KEYS_PER_SEC) break;
      player.keyTimes.push(now);
      const hit = applyKey(player.engine, char === "\b" ? "Backspace" : char);
      if (hit === "correct") player.lastCorrectAt = now;
      this.logKey(player, now, char);
      if (player.engine.finished) {
        player.finishedAt = now;
        break;
      }
    }
    this.emitProgress(player, now);
    if (this.allDone()) this.finishRace();
  }

  private handleFinish(sender: Connection) {
    if (this.status !== "racing") return;
    const player = this.findByConnection(sender.id);
    if (!player || player.isAi) return;
    if (player.engine.finished && !player.finishedAt) {
      player.finishedAt = Date.now();
      this.emitProgress(player, player.finishedAt);
    }
    if (this.allDone()) this.finishRace();
  }

  private maybeAutoStart() {
    if (!this.autoStart || this.status !== "lobby") return;
    const humans = [...this.players.values()].filter((p) => !p.isAi).length;
    if (humans < Math.max(1, this.expectedHumans)) return;
    if (this.mode === "stranger") this.beginCountdown();
    else this.startRace();
  }

  /** Stranger rooms: same passage to everyone, 3-2-1, then a server-set start. */
  private beginCountdown() {
    if (this.status !== "lobby") return;
    this.preparePassage();
    const now = Date.now();
    this.status = "countdown";
    this.countdownEndsAt = now + COUNTDOWN_MS;
    this.alarmKind = "go";
    void this.ctx.storage.setAlarm(this.countdownEndsAt);
    this.broadcastState();
  }

  private go() {
    const now = this.countdownEndsAt ?? Date.now();
    this.status = "racing";
    this.countdownEndsAt = null;
    this.startedAt = null;
    this.armClock(now);
    if (this.allDone()) this.finishRace();
  }

  private preparePassage() {
    if (this.fillAi) this.ensureFillAi();

    const rng = mulberry32(hashSeed(`${this.roomCode}:${Date.now()}`));
    const extras = {
      punctuation: this.settings.punctuation === true,
      numbers: this.settings.numbers === true,
    };
    this.passage =
      this.settings.goal === "words"
        ? generateWords({
            level: this.settings.level,
            count: Math.max(this.settings.time, 1),
            rng,
            extras,
          }).join(" ")
        : generatePassage({
            level: this.settings.level,
            time: this.settings.time,
            // Long enough that even a ~150 wpm racer can't run out of words.
            minChars: Math.round(this.settings.time * 12.5),
            rng,
            extras,
          });
    for (const player of this.players.values()) {
      player.engine = createEngine(this.passage);
      player.finishedAt = null;
      player.keyTimes = [];
      player.keyLog = [];
      player.lastCorrectAt = null;
    }
  }

  private startRace() {
    if (this.status !== "lobby") return;
    this.preparePassage();
    this.status = "racing";
    this.startedAt = null;
    this.endsAt = null;
    this.countdownEndsAt = null;
    this.alarmKind = null;
    this.broadcastState();
  }

  private armClock(now: number) {
    if (this.startedAt) return;
    this.startedAt = now;
    if (this.settings.goal !== "words" && this.settings.time > 0) {
      this.endsAt = now + this.settings.time * 1000;
      this.alarmKind = "end";
      void this.ctx.storage.setAlarm(this.endsAt);
    } else {
      this.endsAt = null;
      this.alarmKind = null;
    }
    this.broadcastState();
    this.startAis();
  }

  private finishRace() {
    if (this.status === "results") return;
    this.status = "results";
    this.alarmKind = null;
    this.clearAis();
    const endedAt = Date.now();
    const results = this.computeResults(endedAt);
    // Leaderboard: timed Strangers races only. Bot racers' real results count
    // under their (pooled, reused) name; humans count with bot-filled seats too.
    const length = String(this.settings.time);
    const ranked =
      this.mode === "stranger" &&
      this.settings.goal !== "words" &&
      !this.settings.punctuation &&
      !this.settings.numbers &&
      isBoardLength(length);
    for (const row of results) {
      const p = this.players.get(row.id);
      if (p?.isAi && ranked && row.finished && !row.flagged && !row.left && row.wpm > 0) {
        void recordBotBoard(this.profiles, p.name, row.wpm, { length, level: this.settings.level, acc: row.accuracy });
        continue;
      }
      if (p?.pid && !p.isAi && !row.flagged && !row.left && row.wpm > 0) {
        const board = ranked && row.finished
          ? { length, level: this.settings.level, acc: row.accuracy }
          : undefined;
        void recordProfileStats(this.profiles, p.pid, row.wpm, board);
      }
    }
    this.broadcastEvent({ type: "results", results, endedAt });
    this.broadcastState();
  }

  private startAis() {
    if (!this.startedAt) return;
    for (const player of this.players.values()) {
      if (!player.isAi) continue;
      const rng = mulberry32(hashSeed(`${player.id}:${this.passage}`));
      const wpm = targetWpm(player.homeWpm ?? 50, rng);
      const strokes = withTypos(
        buildStrokes({
          passage: this.passage,
          targetWpm: wpm,
          level: this.settings.level,
          rng,
        }),
        rng,
      );
      this.runAi(player, strokes, 0, 0);
    }
  }

  private runAi(
    player: InternalPlayer,
    strokes: AiStroke[],
    i: number,
    elapsed: number,
  ) {
    if (this.status !== "racing" || i >= strokes.length) return;
    const stroke = strokes[i]!;
    const timer = setTimeout(() => {
      if (this.status !== "racing") return;
      if (stroke.kind !== "stall" && !player.engine.finished) {
        const now = Date.now();
        const expected = expectedChar(player.engine);
        let key: string | null = null;
        if (stroke.kind === "backspace") key = "\b";
        else if (stroke.kind === "typo") {
          // Slip onto a neighbouring letter; never on spaces.
          key = expected && expected !== " " ? stroke.wrong === expected ? "e" : stroke.wrong : expected;
        } else key = expected;
        if (key) {
          const hit = applyKey(player.engine, key === "\b" ? "Backspace" : key);
          if (hit === "correct") player.lastCorrectAt = now;
          this.logKey(player, now, key);
        }
        if (player.engine.finished) player.finishedAt = now;
        this.emitProgress(player, Date.now());
        if (this.allDone()) {
          this.finishRace();
          return;
        }
      }
      this.runAi(player, strokes, i + 1, elapsed + stroke.wait);
    }, stroke.wait);
    this.aiTimers.push(timer);
  }

  private clearAis() {
    for (const timer of this.aiTimers) clearTimeout(timer);
    this.aiTimers = [];
  }

  private ensureFillAi() {
    const hasAi = [...this.players.values()].some((p) => p.isAi);
    if (hasAi) return;
    const rng = mulberry32(hashSeed(`fill:${this.roomCode}`));
    const id = `kelp-fill-${this.roomCode.slice(0, 6)}`;
    this.players.set(id, {
      id,
      name: "Sable",
      style: "dusk",
      color: COLORS[5],
      isAi: true,
      homeWpm: 48 + Math.floor(rng() * 18),
      engine: createEngine(""),
      connected: true,
      finishedAt: null,
      keyTimes: [],
      keyLog: [],
        lastCorrectAt: null,
      lastProgressAt: 0,
    });
  }

  private logKey(player: InternalPlayer, now: number, key: string) {
    if (!this.startedAt || player.keyLog.length >= MAX_KEY_LOG) return;
    player.keyLog.push([Math.max(0, now - this.startedAt), key]);
  }

  private emitProgress(player: InternalPlayer, now: number) {
    if (now - player.lastProgressAt < 40) return;
    player.lastProgressAt = now;
    this.broadcastEvent({
      type: "progress",
      id: player.id,
      progress: progressOf(player.engine),
      typed: player.engine.index,
      errors: player.engine.errors,
    });
  }

  private allDone() {
    if (![...this.players.values()].length) return false;
    return [...this.players.values()].every(
      (p) => p.engine.finished || !p.connected,
    );
  }

  private computeResults(endedAt: number): ResultRow[] {
    const started = this.startedAt ?? endedAt;
    const words = this.settings.goal === "words";
    const scored = [...this.players.values()].map((player) => {
      const stop = Math.min(player.finishedAt ?? endedAt, endedAt);
      const minutes = Math.max((stop - started) / 60000, 1 / 60);
      const e = player.engine;
      const row: ResultRow = {
        id: player.id,
        name: player.name,
        style: player.style,
        color: player.color,
        wpm: calcWpm(e.netChars, minutes),
        rawWpm: calcWpm(e.totalChars, minutes),
        left: !player.isAi && !player.connected && !e.finished,
        flagged: false,
        elapsed: Math.round(minutes * 60 * 1000) / 1000,
        accuracy: calcAccuracy(e.correctChars, e.totalChars),
        progress: progressOf(e),
        errors: e.errors,
        keys: player.keyLog as KeyLogEntry[] | undefined,
        place: 0,
        // Timed races: anyone still racing when the clock runs out finished.
        finished: e.finished || (!words && (player.isAi || player.connected)),
      };
      // Unrounded numbers for ranking; the row keeps the display values.
      const exact = {
        net: e.netChars / 5 / minutes,
        acc: e.correctChars / Math.max(1, e.totalChars),
        correct: e.correctChars,
        errors: e.errors,
        raw: e.totalChars / 5 / minutes,
        lastCorrect: player.lastCorrectAt ?? Number.POSITIVE_INFINITY,
        finishAt: player.finishedAt ?? Number.POSITIVE_INFINITY,
        progress: progressOf(e),
      };
      // Rate limits make this near-impossible; never rank it if it happens.
      if (row.wpm > MAX_PLAUSIBLE_WPM || row.rawWpm > MAX_PLAUSIBLE_WPM * 1.5) {
        row.flagged = true;
        row.wpm = 0;
        row.rawWpm = 0;
        row.finished = false;
        row.keys = undefined;
      }
      return { row, exact };
    });
    type Scored = (typeof scored)[number];
    const EPS = 1e-9;
    const desc = (x: number, y: number) => (Math.abs(x - y) < EPS ? 0 : y - x);
    const asc = (x: number, y: number) => (x === y ? 0 : x - y);
    /** 0 only when every measure is identical: a genuine tie. */
    const compare = (a: Scored, b: Scored): number => {
      const ra = a.row;
      const rb = b.row;
      if (!!ra.flagged !== !!rb.flagged) return ra.flagged ? 1 : -1;
      if (!!ra.left !== !!rb.left) return ra.left ? 1 : -1;
      if (ra.finished !== rb.finished) return ra.finished ? -1 : 1;
      if (words) {
        // Finish order first, then how far the unfinished got.
        const byFinish = asc(a.exact.finishAt, b.exact.finishAt);
        if (byFinish) return byFinish;
        const byProgress = desc(a.exact.progress, b.exact.progress);
        if (byProgress) return byProgress;
      }
      return (
        desc(a.exact.net, b.exact.net) ||
        desc(a.exact.acc, b.exact.acc) ||
        desc(a.exact.correct, b.exact.correct) ||
        asc(a.exact.errors, b.exact.errors) ||
        desc(a.exact.raw, b.exact.raw) ||
        asc(a.exact.lastCorrect, b.exact.lastCorrect)
      );
    };
    scored.sort(compare);
    // Standard competition ranking: a genuine tie shares a place (1, 1, 3).
    scored.forEach((item, i) => {
      const prev = scored[i - 1];
      if (prev && compare(prev, item) === 0) {
        item.row.place = prev.row.place;
        item.row.tied = true;
        prev.row.tied = true;
      } else {
        item.row.place = i + 1;
      }
    });
    return scored.map((item) => item.row);
  }

  private snapshot(connectionId?: string): RoomState {
    const you = connectionId ? this.findByConnection(connectionId) : undefined;
    return {
      code: this.roomCode,
      mode: this.mode,
      status: this.status,
      settings: this.settings,
      passage: this.status === "lobby" ? "" : this.passage,
      players: [...this.players.values()].map(toPublic),
      hostId: this.hostId,
      fillAi: this.fillAi,
      startedAt: this.startedAt,
      endsAt: this.endsAt,
      countdownEndsAt: this.countdownEndsAt,
      youAreHost: you?.id === this.hostId,
      serverNow: Date.now(),
      expectedHumans: this.expectedHumans,
      maxPlayers: this.mode === "friends" ? this.maxPlayers : undefined,
    };
  }

  private broadcastState() {
    for (const conn of this.getConnections()) {
      this.sendState(conn);
    }
  }

  private sendState(connection: Connection) {
    connection.send(encode({ type: "state", state: this.snapshot(connection.id) }));
  }

  private broadcastEvent(event: ServerEvent) {
    this.broadcast(encode(event));
  }

  private findByConnection(connectionId: string) {
    for (const player of this.players.values()) {
      if (player.connectionId === connectionId) return player;
    }
    return undefined;
  }

  private connectedHumans() {
    return [...this.players.values()].filter((p) => !p.isAi && p.connected);
  }

  private firstHuman() {
    return [...this.players.values()].find((p) => !p.isAi && p.connected);
  }
}

function encode(event: ServerEvent): string {
  return JSON.stringify(event);
}

function toPublic(player: InternalPlayer): PlayerPublic {
  return {
    id: player.id,
    name: player.name,
    style: player.style,
    color: player.color,
    progress: progressOf(player.engine),
    typed: player.engine.index,
    errors: player.engine.errors,
    totalChars: player.engine.totalChars,
    finished: player.engine.finished,
    connected: player.connected,
  };
}

function parseSettings(raw: unknown): RoomSettings | null {
  const data = asRecord(raw);
  if (!data) return null;
  if (!isTimeLimit(data.time) || !isLevel(data.level)) return null;
  return {
    time: data.time,
    level: data.level,
    punctuation: data.punctuation === true,
    numbers: data.numbers === true,
    goal: data.goal === "words" ? "words" : "time",
  };
}

function parseSetup(raw: unknown): SetupPayload | null {
  const data = asRecord(raw);
  if (!data) return null;
  const settings = parseSettings(data.settings);
  if (!settings) return null;
  if (!isGameMode(data.mode)) return null;
  const payload: SetupPayload = {
    mode: data.mode,
    settings,
    autoStart: data.autoStart === true,
    expectedHumans:
      typeof data.expectedHumans === "number"
        ? Math.max(1, Math.min(ROOM_CAP, Math.round(data.expectedHumans)))
        : 1,
    fillAi: data.fillAi === true,
  };
  const ai = parseAi(data.ai);
  if (ai) payload.ai = ai;
  if (Array.isArray(data.ais)) {
    payload.ais = data.ais
      .slice(0, ROOM_CAP - 1)
      .map(parseAi)
      .filter((v): v is NonNullable<typeof v> => !!v);
  }
  return payload;
}

function parseAi(raw: unknown): SetupAi | null {
  const ai = asRecord(raw);
  if (!ai) return null;
  const name = sanitizeName(ai.name, "");
  if (!name || !isStyleId(ai.style) || !isColorHex(ai.color) || typeof ai.homeWpm !== "number") {
    return null;
  }
  return {
    id: typeof ai.id === "string" ? ai.id.slice(0, 40) : `ai-${name}`,
    name,
    style: ai.style,
    color: ai.color,
    homeWpm: Math.max(10, Math.min(200, ai.homeWpm)),
  };
}



type AiStroke = Stroke | { kind: "typo"; wait: number; wrong: string } | { kind: "backspace"; wait: number };

const LETTERS = "etaoinshrdlucmfwypvbgk";

/** Bots slip now and then and fix it, like a person (about 1 in 40 keys). */
function withTypos(strokes: Stroke[], rng: () => number): AiStroke[] {
  const out: AiStroke[] = [];
  for (const stroke of strokes) {
    if (stroke.kind === "char" && rng() < 0.025) {
      out.push({ kind: "typo", wait: stroke.wait, wrong: LETTERS[Math.floor(rng() * LETTERS.length)]! });
      out.push({ kind: "backspace", wait: 140 + rng() * 220 });
      out.push({ kind: "char", wait: 90 + rng() * 120 });
      continue;
    }
    out.push(stroke);
  }
  return out;
}
