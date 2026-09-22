import type * as Party from "partykit/server";
import { pickAi } from "../lib/ai/pool";
import { bandForWpm, queueWaitMs } from "../lib/bands";
import {
  asRecord,
  parseJsonEvent,
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
import { clientIp, gateOrigin, rateLimitCreate } from "./origin";

type Waiting = {
  connection: Party.Connection;
  name: string;
  style: StyleId;
  color: ColorHex;
  level: Level;
  time: TimeLimit;
  punctuation: boolean;
  numbers: boolean;
  goal: "time" | "words";
  wpm?: number;
  firstVisit: boolean;
  queuedAt: number;
  waitMs: number;
  ip: string;
};

export default class Matchmaker implements Party.Server {
  waiting: Waiting[] = [];
  timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(readonly room: Party.Room) {}

  static onBeforeConnect(req: Party.Request) {
    return gateOrigin(req);
  }

  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    connection.setState({ ip: clientIp(ctx.request) });
  }

  onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof message !== "string") return;
    const parsed = parseJsonEvent(message);
    const data = asRecord(parsed);
    if (!data || typeof data.type !== "string") return;
    if (data.type === "cancel") {
      this.remove(sender.id);
      return;
    }
    if (data.type !== "queue") return;

    if (!isLevel(data.level) || !isTimeLimit(data.time)) {
      sender.send(encode({ type: "error", message: "Invalid queue." }));
      return;
    }
    const name = sanitizeName(data.name, "");
    if (name.length < 2) {
      sender.send(encode({ type: "error", message: "Name is too short." }));
      return;
    }
    const style = isStyleId(data.style) ? data.style : "kelp";
    const color = isColorHex(data.color) ? data.color : "#2A9D8F";
    const ip =
      (sender.state as { ip?: string } | null)?.ip ||
      "local";
    if (!rateLimitCreate(ip)) {
      sender.send(encode({ type: "error", message: "Slow down." }));
      return;
    }

    this.remove(sender.id);
    const firstVisit = data.firstVisit === true;
    const rng = mulberry32(hashSeed(`${sender.id}:${Date.now()}`));
    const waiter: Waiting = {
      connection: sender,
      name,
      style,
      color,
      level: data.level,
      time: data.time,
      punctuation: data.punctuation === true,
      numbers: data.numbers === true,
      goal: data.goal === "words" ? "words" : "time",
      wpm: typeof data.wpm === "number" ? data.wpm : undefined,
      firstVisit,
      queuedAt: Date.now(),
      waitMs: queueWaitMs(firstVisit, rng),
      ip,
    };
    this.waiting.push(waiter);
    sender.send(encode({ type: "waiting" }));

    const partner = this.findPartner(waiter);
    if (partner) {
      void this.matchHumans(waiter, partner);
      return;
    }

    const timer = setTimeout(() => {
      void this.fillWithAi(sender.id);
    }, waiter.waitMs);
    this.timers.set(sender.id, timer);
  }

  onClose(connection: Party.Connection) {
    this.remove(connection.id);
  }

  private findPartner(waiter: Waiting): Waiting | null {
    const band = bandForWpm(waiter.wpm);
    for (const other of this.waiting) {
      if (other.connection.id === waiter.connection.id) continue;
      if (other.level !== waiter.level || other.time !== waiter.time) continue;
      if (other.goal !== waiter.goal) continue;
      if (
        other.punctuation !== waiter.punctuation ||
        other.numbers !== waiter.numbers
      ) {
        continue;
      }
      const otherBand = bandForWpm(other.wpm);
      if (band === "any" || otherBand === "any") return other;
      if (band.min <= otherBand.max && otherBand.min <= band.max) return other;
    }
    return null;
  }

  private async matchHumans(a: Waiting, b: Waiting) {
    this.remove(a.connection.id);
    this.remove(b.connection.id);
    const code = createRoomCode();
    const ok = await this.setupRoom({
      mode: "stranger",
      settings: {
        time: a.time,
        level: a.level,
        punctuation: a.punctuation,
        numbers: a.numbers,
        goal: a.goal,
      },
      autoStart: true,
      expectedHumans: 2,
      fillAi: false,
    }, code);
    if (!ok) {
      a.connection.send(encode({ type: "error", message: "Could not open a room." }));
      b.connection.send(encode({ type: "error", message: "Could not open a room." }));
      return;
    }
    a.connection.send(encode({ type: "matched", code }));
    b.connection.send(encode({ type: "matched", code }));
  }

  private async fillWithAi(connectionId: string) {
    const waiter = this.waiting.find((w) => w.connection.id === connectionId);
    if (!waiter) return;
    this.remove(connectionId);
    const rng = mulberry32(hashSeed(`ai:${connectionId}:${Date.now()}`));
    const ai = pickAi({
      band: bandForWpm(waiter.wpm),
      level: waiter.level,
      firstVisit: waiter.firstVisit,
      rng,
    });
    const code = createRoomCode();
    const ok = await this.setupRoom(
      {
        mode: "stranger",
        settings: {
          time: waiter.time,
          level: waiter.level,
          punctuation: waiter.punctuation,
          numbers: waiter.numbers,
          goal: waiter.goal,
        },
        autoStart: true,
        expectedHumans: 1,
        fillAi: true,
        ai,
      },
      code,
    );
    if (!ok) {
      waiter.connection.send(
        encode({ type: "error", message: "Could not open a room." }),
      );
      return;
    }
    waiter.connection.send(encode({ type: "matched", code }));
  }

  private async setupRoom(payload: SetupPayload, code: string): Promise<boolean> {
    try {
      const stub = this.room.context.parties.main.get(code);
      const res = await stub.fetch("https://party/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private remove(id: string) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.waiting = this.waiting.filter((w) => w.connection.id !== id);
  }
}

function encode(event: MatchmakerOut): string {
  return JSON.stringify(event);
}


