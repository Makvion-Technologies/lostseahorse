import type * as Party from "partykit/server";
import { pickAi } from "../lib/ai/pool";
import { bandForWpm } from "../lib/bands";
import {
  SIZE_SEATS,
  asRecord,
  isMatchSize,
  parseJsonEvent,
  type MatchSize,
  type MatchmakerOut,
  type SetupPayload,
} from "../lib/party/events";
import { createRoomCode } from "../lib/roomCode";
import { sanitizeName } from "../lib/names";
import { hashSeed, mulberry32 } from "../lib/rng";
import {
  isColorHex,
  isLevel,
  isStyleId,
  isTimeLimit,
  type ColorHex,
  type Level,
  type StyleId,
  type TimeLimit,
} from "../lib/types";
import { INTERNAL_HEADER, clientIp, gateOrigin } from "./origin";
import { lookupProfile } from "./profiles";

/** Match not full after a random 13-20s: fill the empty seats with bots. */
const LONELY_MIN_MS = 13_000;
const LONELY_SPAN_MS = 7_000;

/** Queue entries older than this are dropped (tab asleep, socket half-dead). */
const STALE_MS = 10 * 60_000;
/** Per-connection queue/bot message budget. */
const MSG_WINDOW_MS = 10_000;
const MSG_MAX = 6;
/** Per-IP match budget per minute (stops scripted room spam). */
const IP_WINDOW_MS = 60_000;
const IP_MAX = 20;

type Waiting = {
  connection: Party.Connection;
  clientId: string;
  name: string;
  style: StyleId;
  color: ColorHex;
  level: Level;
  time: TimeLimit;
  punctuation: boolean;
  numbers: boolean;
  goal: "time" | "words";
  size: MatchSize;
  wpm?: number;
  firstVisit: boolean;
  queuedAt: number;
  ip: string;
};

function bucketOf(w: Waiting): string {
  return [w.goal, w.time, w.level, w.punctuation ? 1 : 0, w.numbers ? 1 : 0, w.size].join(":");
}

export default class Matchmaker implements Party.Server {
  options: Party.ServerOptions = { hibernate: false };
  waiting: Waiting[] = [];
  msgTimes = new Map<string, number[]>();
  ipTimes = new Map<string, number[]>();
  lonelyTimers = new Map<string, ReturnType<typeof setTimeout>>();
  closed = new Set<string>();

  constructor(readonly room: Party.Room) {}

  static onBeforeConnect(req: Party.Request) {
    return gateOrigin(req);
  }

  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    connection.setState({ ip: clientIp(ctx.request) });
  }

  onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== "string") return;
    const data = asRecord(parseJsonEvent(message));
    if (!data || typeof data.type !== "string") return;
    if (data.type === "cancel") {
      this.remove(sender.id);
      return;
    }
    if (data.type !== "queue" && data.type !== "bot") return;
    if (!this.allowMessage(sender.id)) {
      sender.send(encode({ type: "error", message: "Slow down a moment." }));
      return;
    }
    if (data.type === "bot") {
      void this.fillWithAi(sender.id);
      return;
    }
    void this.handleQueue(sender, data);
  }

  onClose(connection: Party.Connection) {
    this.closed.add(connection.id);
    setTimeout(() => this.closed.delete(connection.id), 60_000);
    this.remove(connection.id);
    this.msgTimes.delete(connection.id);
  }

  onError(connection: Party.Connection) {
    this.onClose(connection);
  }

  private async handleQueue(sender: Party.Connection, data: Record<string, unknown>) {
    if (!isLevel(data.level) || !isTimeLimit(data.time) || data.time > 600) {
      sender.send(encode({ type: "error", message: "Invalid queue." }));
      return;
    }
    // The server owns names: look the racer up by profile id, ignore client text.
    const profile = await lookupProfile(this.room, data.pid);
    if (this.closed.has(sender.id)) return;
    if (!profile) {
      sender.send(encode({ type: "error", message: "Pick your racer name first." }));
      return;
    }
    const name = sanitizeName(profile.name, "racer");
    this.sweep();
    const ip = (sender.state as { ip?: string } | null)?.ip || "local";
    const clientId =
      typeof data.clientId === "string" && /^[A-Za-z0-9_-]{6,40}$/.test(data.clientId)
        ? data.clientId
        : sender.id;

    // Same browser in another tab: the newest tab wins.
    for (const other of this.waiting) {
      if (other.clientId === clientId && other.connection.id !== sender.id) {
        other.connection.send(encode({ type: "replaced" }));
        this.remove(other.connection.id);
      }
    }
    this.remove(sender.id);

    const waiter: Waiting = {
      connection: sender,
      clientId,
      name,
      style: isStyleId(data.style) ? data.style : "kelp",
      color: isColorHex(data.color) ? data.color : "#2A9D8F",
      level: data.level,
      time: data.time,
      punctuation: data.punctuation === true,
      numbers: data.numbers === true,
      goal: "time",
      size: isMatchSize(data.size) ? data.size : "1v1",
      wpm:
        typeof data.wpm === "number" && Number.isFinite(data.wpm)
          ? data.wpm
          : undefined,
      firstVisit: data.firstVisit === true,
      queuedAt: Date.now(),
      ip,
    };
    this.waiting.push(waiter);
    this.tryMatch(bucketOf(waiter));
    this.armLonely(sender.id);
  }

  private tryMatch(bucket: string) {
    const group = this.waiting.filter((w) => bucketOf(w) === bucket);
    if (!group.length) return;
    const seats = SIZE_SEATS[group[0]!.size];
    while (group.length >= seats) {
      void this.matchGroup(group.splice(0, seats), 0);
    }
    this.notify(group);
  }

  private notify(group: Waiting[]) {
    for (const w of group) {
      w.connection.send(encode({ type: "waiting", count: group.length, size: w.size }));
    }
  }

  /** Seat everyone in `group` plus `bots` untagged bots, then send them in. */
  private async matchGroup(group: Waiting[], bots: number) {
    for (const w of group) this.remove(w.connection.id, false);
    const first = group[0]!;
    if (!this.allowIp(first.ip)) {
      for (const w of group) {
        w.connection.send(encode({ type: "error", message: "Too many matches. Try again in a minute." }));
      }
      return;
    }
    const rng = mulberry32(hashSeed(`ai:${first.connection.id}:${Date.now()}`));
    const avgWpm = (() => {
      const known = group.map((w) => w.wpm).filter((v): v is number => typeof v === "number");
      return known.length ? known.reduce((x, y) => x + y, 0) / known.length : undefined;
    })();
    const taken = new Set(group.map((w) => w.name.toLowerCase()));
    const used = new Set<string>();
    const ais: NonNullable<SetupPayload["ais"]> = [];
    for (let i = 0; i < bots; i++) {
      let ai = pickAi({ band: bandForWpm(avgWpm), level: first.level, firstVisit: group.every((w) => w.firstVisit), rng, exclude: used });
      for (let t = 0; t < 8 && taken.has(ai.name.toLowerCase()); t++) {
        used.add(ai.id.replace(/-\d+$/, ""));
        ai = pickAi({ band: "any", level: first.level, firstVisit: false, rng, exclude: used });
      }
      used.add(ai.id.replace(/-\d+$/, ""));
      taken.add(ai.name.toLowerCase());
      ais.push({ id: `${ai.id}-${i}`, name: ai.name, style: ai.style, color: ai.color, homeWpm: ai.homeWpm });
    }
    const code = createRoomCode();
    const ok = await this.setupRoom(
      {
        mode: "stranger",
        settings: {
          time: first.time,
          level: first.level,
          punctuation: first.punctuation,
          numbers: first.numbers,
          goal: first.goal,
        },
        autoStart: true,
        expectedHumans: group.length,
        fillAi: false,
        ais,
      },
      code,
    );
    const everyone = [...group.map((w) => w.name), ...ais.map((a) => a.name)];
    for (const w of group) {
      const names = everyone.filter((_, i) => i !== group.indexOf(w));
      w.connection.send(
        encode(ok ? { type: "matched", code, names } : { type: "error", message: "Could not open a room." }),
      );
    }
  }

  /** Start now: whoever is waiting in this bucket, the empty seats go to bots. */
  private async fillWithAi(connectionId: string) {
    const waiter = this.waiting.find((w) => w.connection.id === connectionId);
    if (!waiter) return;
    this.sweep();
    const bucket = bucketOf(waiter);
    const seats = SIZE_SEATS[waiter.size];
    const others = this.waiting.filter((w) => w !== waiter && bucketOf(w) === bucket);
    const group = [waiter, ...others].slice(0, seats);
    await this.matchGroup(group, seats - group.length);
    this.tryMatch(bucket);
  }

  private async setupRoom(payload: SetupPayload, code: string): Promise<boolean> {
    try {
      const stub = this.room.context.parties.main.get(code);
      const res = await stub.fetch("/setup", {
        method: "POST",
        headers: { "content-type": "application/json", [INTERNAL_HEADER]: "1" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private allowMessage(id: string): boolean {
    const now = Date.now();
    const prev = (this.msgTimes.get(id) ?? []).filter((t) => now - t < MSG_WINDOW_MS);
    if (prev.length >= MSG_MAX) {
      this.msgTimes.set(id, prev);
      return false;
    }
    prev.push(now);
    this.msgTimes.set(id, prev);
    return true;
  }

  private allowIp(ip: string): boolean {
    if (ip === "local") return true;
    const now = Date.now();
    const prev = (this.ipTimes.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
    if (prev.length >= IP_MAX) return false;
    prev.push(now);
    this.ipTimes.set(ip, prev);
    return true;
  }

  /** Drop entries whose socket is gone or that sat in the queue too long. */
  private sweep() {
    const live = new Set([...this.room.getConnections()].map((c) => c.id));
    const now = Date.now();
    for (const w of [...this.waiting]) {
      if (!live.has(w.connection.id) || now - w.queuedAt > STALE_MS) {
        this.remove(w.connection.id);
      }
    }
  }

  /** Still waiting after the lonely delay: start with bots in the empty seats. */
  private armLonely(id: string) {
    const prev = this.lonelyTimers.get(id);
    if (prev) clearTimeout(prev);
    this.lonelyTimers.set(
      id,
      setTimeout(() => {
        this.lonelyTimers.delete(id);
        const waiter = this.waiting.find((w) => w.connection.id === id);
        if (!waiter) return;
        void this.fillWithAi(id);
      }, LONELY_MIN_MS + Math.floor(Math.random() * LONELY_SPAN_MS)),
    );
  }

  private remove(id: string, rematch = true) {
    const timer = this.lonelyTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.lonelyTimers.delete(id);
    }
    const gone = this.waiting.find((w) => w.connection.id === id);
    this.waiting = this.waiting.filter((w) => w.connection.id !== id);
    if (gone && rematch) this.tryMatch(bucketOf(gone));
  }
}

function encode(event: MatchmakerOut): string {
  return JSON.stringify(event);
}
