"use client";

import { useCallback, useState } from "react";
import usePartySocket from "partysocket/react";
import { partyHost } from "@/lib/env";
import { asRecord, parseJsonEvent } from "@/lib/party/events";
import type { ColorHex, Level, StyleId, TimeLimit } from "@/lib/types";

export function useMatchmaker(enabled: boolean) {
  const [status, setStatus] = useState<"idle" | "waiting" | "matched" | "error">(
    "idle",
  );
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socket = usePartySocket({
    host: partyHost(),
    party: "matchmaker",
    room: "kelp",
    enabled,
    onMessage(event) {
      const data = asRecord(parseJsonEvent(String(event.data)));
      if (!data || typeof data.type !== "string") return;
      if (data.type === "waiting") setStatus("waiting");
      if (data.type === "matched" && typeof data.code === "string") {
        setCode(data.code);
        setStatus("matched");
      }
      if (data.type === "error") {
        setError(String(data.message ?? "Queue drifted."));
        setStatus("error");
      }
    },
  });

  const queue = useCallback(
    (payload: {
      name: string;
      style: StyleId;
      color: ColorHex;
      level: Level;
      time: TimeLimit;
      wpm?: number;
      firstVisit: boolean;
    }) => {
      setStatus("waiting");
      socket.send(JSON.stringify({ type: "queue", ...payload }));
    },
    [socket],
  );

  const cancel = useCallback(() => {
    socket.send(JSON.stringify({ type: "cancel" }));
    setStatus("idle");
  }, [socket]);

  return { status, code, error, queue, cancel };
}
