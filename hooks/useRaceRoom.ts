"use client";

import { useCallback, useState, useRef } from "react";
import usePartySocket from "partysocket/react";
import { partyHost } from "@/lib/env";
import {
  TYPING_BATCH_MS,
  parseServerEvent,
  asRecord,
  type ClientEvent,
  type ResultRow,
  type RoomState,
} from "@/lib/party/events";

export function useRaceRoom(code: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** serverNow - Date.now(), so countdowns line up across clients. */
  const [offset, setOffset] = useState(0);
  const batch = useRef("");
  const timer = useRef<number | null>(null);

  const socket = usePartySocket({
    host: partyHost(),
    room: code ?? "idle",
    enabled: Boolean(code),
    onMessage(event) {
      const parsed = parseServerEvent(String(event.data));
      const data = asRecord(parsed);
      if (!data || typeof data.type !== "string") return;
      if (data.type === "state") {
        const next = data.state as RoomState;
        if (typeof next.serverNow === "number") setOffset(next.serverNow - Date.now());
        setState(next);
        // Friends "race again": back in the lobby, so drop the old results.
        if (next.status !== "results") setResults(null);
      } else if (data.type === "progress") {
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map((player) =>
              player.id === data.id
                ? {
                    ...player,
                    progress: Number(data.progress) || 0,
                    typed: Number(data.typed) || 0,
                    errors: Number(data.errors) || 0,
                  }
                : player,
            ),
          };
        });
      } else if (data.type === "results") {
        setResults(data.results as ResultRow[]);
      } else if (data.type === "error") {
        setError(String(data.message ?? "Something drifted."));
      }
    },
  });

  const send = useCallback(
    (event: ClientEvent) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(event));
      }
    },
    [socket],
  );

  const sendTyped = useCallback(
    (key: string) => {
      const token = key === "Backspace" ? "\b" : key;
      if (token !== "\b" && token.length !== 1) return;
      batch.current += token;
      if (timer.current) return;
      timer.current = window.setTimeout(() => {
        const keys = batch.current;
        batch.current = "";
        timer.current = null;
        if (keys) send({ type: "typed", keys });
      }, TYPING_BATCH_MS);
    },
    [send],
  );

  return {
    state,
    results,
    error,
    offset,
    youId: socket.id,
    send,
    sendTyped,
    connected: socket.readyState === WebSocket.OPEN,
  };
}
