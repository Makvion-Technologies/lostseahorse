"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import usePartySocket from "partysocket/react";
import { partyHost } from "@/lib/env";
import { asRecord, parseJsonEvent, type MatchSize } from "@/lib/party/events";
import type { ColorHex, Level, StyleId, TimeLimit } from "@/lib/types";

export type QueuePayload = {
  /** Profile id; the server resolves the name. */
  pid: string;
  style: StyleId;
  color: ColorHex;
  level: Level;
  time: TimeLimit;
  punctuation?: boolean;
  numbers?: boolean;
  goal?: "time" | "words";
  wpm?: number;
  firstVisit: boolean;
  size?: MatchSize;
};

export type MatchStatus = "idle" | "waiting" | "matched" | "error" | "replaced";

const CLIENT_KEY = "lostseahorse.cid";

/** Stable per-browser id so a second tab replaces the first in the queue. */
function clientId(): string {
  try {
    let id = window.localStorage.getItem(CLIENT_KEY);
    if (!id || !/^[A-Za-z0-9_-]{6,40}$/.test(id)) {
      id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      window.localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

export function useMatchmaker(enabled: boolean) {
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [opponents, setOpponents] = useState<string[]>([]);
  const pending = useRef<string | null>(null);
  const statusRef = useRef<MatchStatus>("idle");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const socket = usePartySocket({
    host: partyHost(),
    party: "matchmaker",
    room: "kelp",
    enabled,
    onOpen() {
      // Queue sent before the socket opened, or re-queue after a reconnect.
      if (pending.current && statusRef.current === "waiting") {
        socket.send(pending.current);
      }
    },
    onMessage(event) {
      const data = asRecord(parseJsonEvent(String(event.data)));
      if (!data || typeof data.type !== "string") return;
      if (data.type === "waiting") {
        setCount(typeof data.count === "number" ? data.count : 0);
        if (statusRef.current !== "idle") setStatus("waiting");
      }
      if (data.type === "matched" && typeof data.code === "string") {
        pending.current = null;
        setOpponents(
          Array.isArray(data.names)
            ? data.names.filter((n): n is string => typeof n === "string").slice(0, 8)
            : [],
        );
        setCode(data.code);
        setStatus("matched");
      }
      if (data.type === "replaced") {
        pending.current = null;
        setStatus("replaced");
      }
      if (data.type === "error") {
        pending.current = null;
        setError(String(data.message ?? "Queue drifted."));
        setStatus("error");
      }
    },
  });

  const queue = useCallback(
    (payload: QueuePayload) => {
      const message = JSON.stringify({ type: "queue", clientId: clientId(), ...payload });
      pending.current = message;
      setError(null);
      setCount(0);
      setOpponents([]);
      setStatus("waiting");
      statusRef.current = "waiting";
      if (socket.readyState === WebSocket.OPEN) socket.send(message);
    },
    [socket],
  );

  const cancel = useCallback(() => {
    pending.current = null;
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "cancel" }));
    }
    setStatus("idle");
    statusRef.current = "idle";
  }, [socket]);

  return { status, code, error, count, opponents, queue, cancel };
}
