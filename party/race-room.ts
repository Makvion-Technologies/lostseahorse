import type * as Party from "partykit/server";
import { buildStrokes, targetWpm, type Stroke } from "../lib/ai/typer";
import { generatePassage, generateWords } from "../lib/generatePassage";
import {
  MAX_KEYS_PER_BATCH,
  MAX_KEYS_PER_SEC,
  MAX_MESSAGE_BYTES,
  ROOM_CAP,
  asRecord,
  parseJsonEvent,
  type PlayerPublic,
  type ResultRow,
  type RoomSettings,
  type RoomState,
  type RoomStatus,
  type ServerEvent,
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
import { clientIp, gateOrigin, rateLimitCreate } from "./origin";

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
  lastProgressAt: number;
};

export default class RaceRoom implements Party.Server {
  options: Party.ServerOptions = { hibernate: false };

  settings: RoomSettings = { time: 30, level: "medium" };
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
  configured = false;
  alarmKind: "end" | null = null;
  aiTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(readonly room: Party.Room) {}

  static onBeforeConnect(req: Party.Request) {
    return gateOrigin(req);
  }

  static onBeforeRequest(req: Party.Request) {
    return gateOrigin(req);
  }

  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname.endsWith("/setup")) {
      if (!rateLimitCreate(clientIp(req))) {
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

  onConnect(connection: Party.Connection) {
    if (!isValidRoomCode(this.room.id) && this.room.id.length > 32) {
      connection.send(encode({ type: "error", message: "Invalid room." }));
      connection.close();
      return;
    }
    this.sendState(connection);
  }

  onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== "string") return;
    if (message.length > MAX_MESSAGE_BYTES) return;
    const parsed = parseJsonEvent(message);
    const data = asRecord(parsed);
    if (!data || typeof data.type !== "string") return;

    if (data.type === "join") this.handleJoin(sender, data);
    else if (data.type === "start") this.handleStart(sender);
    else if (data.type === "fillAi") this.handleFillAi(sender, data);
    else if (data.type === "typed") this.handleTyped(sender, data);
    else if (data.type === "finish") this.handleFinish(sender);
  }

  onClose(connection: Party.Connection) {
    const player = this.findByConnection(connection.id);
    if (!player || player.isAi) return;
    player.connected = false;
    player.connectionId = undefined;
    if (this.status === "lobby") {
      this.players.delete(player.id);
      if (this.hostId === player.id) {
        this.hostId = this.firstHuman()?.id ?? null;
      }
    }
    this.broadcastState();
  }

  async onAlarm() {
    if (this.alarmKind === "end" && this.status === "racing") {
      this.finishRace();
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
    if (setup.ai && !this.players.has(setup.ai.id)) {
      this.players.set(setup.ai.id, {
        id: setup.ai.id,
        name: sanitizeName(setup.ai.name),
        style: setup.ai.style,
        color: setup.ai.color,
        isAi: true,
        homeWpm: setup.ai.homeWpm,
        engine: createEngine(""),
        connected: true,
        finishedAt: null,
        keyTimes: [],
        lastProgressAt: 0,
      });
    }
    this.broadcastState();
  }

  private handleJoin(sender: Party.Connection, data: Record<string, unknown>) {
    const existing = this.findByConnection(sender.id);
    if (existing) {
      this.sendState(sender);
      return;
    }

    if (this.status !== "lobby") {
      sender.send(encode({ type: "error", message: "Race already moving." }));
      return;
    }

    const humans = [...this.players.values()].filter((p) => !p.isAi).length;
    if (humans >= ROOM_CAP) {
      sender.send(encode({ type: "error", message: "Room is full." }));
      return;
    }

    const name = sanitizeName(data.name, "");
    if (name.length < 2) {
      sender.send(encode({ type: "error", message: "Name is too short." }));
      return;
    }
    const style = isStyleId(data.style) ? data.style : "kelp";
    const color = isColorHex(data.color) ? data.color : COLORS[0];

    if (!this.configured) {
      const settings = parseSettings(data.settings);
      if (settings) this.settings = settings;
      if (isGameMode(data.mode)) this.mode = data.mode;
      if (typeof data.fillAi === "boolean") this.fillAi = data.fillAi;
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
      lastProgressAt: 0,
    };
    this.players.set(id, player);
    if (!this.hostId) this.hostId = id;

    this.broadcastState();
    this.maybeAutoStart();
  }

  private handleFillAi(sender: Party.Connection, data: Record<string, unknown>) {
    const player = this.findByConnection(sender.id);
    if (!player || player.id !== this.hostId) return;
    if (this.status !== "lobby") return;
    this.fillAi = data.on === true;
    this.broadcastState();
  }

  private handleStart(sender: Party.Connection) {
    const player = this.findByConnection(sender.id);
    if (!player || player.id !== this.hostId) return;
    if (this.status !== "lobby") return;
    this.startRace();
  }

  private handleTyped(sender: Party.Connection, data: Record<string, unknown>) {
    if (this.status !== "racing") return;
    const player = this.findByConnection(sender.id);
    if (!player || player.isAi || player.engine.finished) return;
    if (typeof data.keys !== "string") return;
    const keys = data.keys.slice(0, MAX_KEYS_PER_BATCH);
    const now = Date.now();
    if ([...keys].some((char) => char !== "\b")) this.armClock(now);
    player.keyTimes = player.keyTimes.filter((t) => now - t < 1000);
    for (const char of keys) {
      if (player.keyTimes.length >= MAX_KEYS_PER_SEC) break;
      player.keyTimes.push(now);
      applyKey(player.engine, char === "\b" ? "Backspace" : char);
      if (player.engine.finished) {
        player.finishedAt = now;
        break;
      }
    }
    this.emitProgress(player, now);
    if (this.allDone()) this.finishRace();
  }

  private handleFinish(sender: Party.Connection) {
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
    if (humans >= Math.max(1, this.expectedHumans)) this.startRace();
  }

  private startRace() {
    if (this.status !== "lobby") return;
    if (this.fillAi) this.ensureFillAi();

    const rng = mulberry32(hashSeed(`${this.room.id}:${Date.now()}`));
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
            rng,
            extras,
          });
    for (const player of this.players.values()) {
      player.engine = createEngine(this.passage);
      player.finishedAt = null;
      player.keyTimes = [];
    }
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
      void this.room.storage.setAlarm(this.endsAt);
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
    this.broadcast({ type: "results", results, endedAt });
    this.broadcastState();
  }

  private startAis() {
    if (!this.startedAt) return;
    for (const player of this.players.values()) {
      if (!player.isAi) continue;
      const rng = mulberry32(hashSeed(`${player.id}:${this.passage}`));
      const wpm = targetWpm(player.homeWpm ?? 50, rng);
      const strokes = buildStrokes({
        passage: this.passage,
        targetWpm: wpm,
        level: this.settings.level,
        rng,
      });
      this.runAi(player, strokes, 0, 0);
    }
  }

  private runAi(
    player: InternalPlayer,
    strokes: Stroke[],
    i: number,
    elapsed: number,
  ) {
    if (this.status !== "racing" || i >= strokes.length) return;
    const stroke = strokes[i]!;
    const timer = setTimeout(() => {
      if (this.status !== "racing") return;
      if (stroke.kind === "char" && !player.engine.finished) {
        const expected = expectedChar(player.engine);
        if (expected) applyKey(player.engine, expected);
        if (player.engine.finished) player.finishedAt = Date.now();
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
    const rng = mulberry32(hashSeed(`fill:${this.room.id}`));
    const id = `kelp-fill-${this.room.id.slice(0, 6)}`;
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
      lastProgressAt: 0,
    });
  }

  private emitProgress(player: InternalPlayer, now: number) {
    if (now - player.lastProgressAt < 40) return;
    player.lastProgressAt = now;
    this.broadcast({
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
    const rows = [...this.players.values()].map((player) => {
      const stop = Math.min(player.finishedAt ?? endedAt, endedAt);
      const minutes = Math.max((stop - started) / 60000, 1 / 60);
      return {
        id: player.id,
        name: player.name,
        style: player.style,
        color: player.color,
        wpm: calcWpm(player.engine.correctChars, minutes),
        accuracy: calcAccuracy(player.engine.correctChars, player.engine.totalChars),
        progress: progressOf(player.engine),
        errors: player.engine.errors,
        place: 0,
        finished: player.engine.finished,
      };
    });
    rows.sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.progress !== b.progress) return b.progress - a.progress;
      if (a.wpm !== b.wpm) return b.wpm - a.wpm;
      return a.errors - b.errors;
    });
    rows.forEach((row, i) => {
      row.place = i + 1;
    });
    return rows;
  }

  private snapshot(connectionId?: string): RoomState {
    const you = connectionId ? this.findByConnection(connectionId) : undefined;
    return {
      code: this.room.id,
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
    };
  }

  private broadcastState() {
    for (const conn of this.room.getConnections()) {
      this.sendState(conn);
    }
  }

  private sendState(connection: Party.Connection) {
    connection.send(encode({ type: "state", state: this.snapshot(connection.id) }));
  }

  private broadcast(event: ServerEvent) {
    this.room.broadcast(encode(event));
  }

  private findByConnection(connectionId: string) {
    for (const player of this.players.values()) {
      if (player.connectionId === connectionId) return player;
    }
    return undefined;
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
  const ai = asRecord(data.ai);
  if (ai) {
    const name = sanitizeName(ai.name, "");
    if (
      name &&
      isStyleId(ai.style) &&
      isColorHex(ai.color) &&
      typeof ai.homeWpm === "number"
    ) {
      payload.ai = {
        id: typeof ai.id === "string" ? ai.id.slice(0, 40) : `ai-${name}`,
        name,
        style: ai.style,
        color: ai.color,
        homeWpm: Math.max(10, Math.min(200, ai.homeWpm)),
      };
    }
  }
  return payload;
}


