"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { WaitingRoom } from "@/components/lobby/WaitingRoom";
import { ResultBoard } from "@/components/typing/ResultBoard";
import { TypingPane } from "@/components/typing/TypingPane";
import { Card } from "@/components/ui/Card";
import { useRaceRoom } from "@/hooks/useRaceRoom";
import { useSave } from "@/hooks/useSave";
import { useTypingSession } from "@/hooks/useTypingSession";
import { isValidRoomCode } from "@/lib/roomCode";
import { isLevel, isTimeLimit, type Level, type TimeLimit } from "@/lib/types";
import { updateWpm } from "@/lib/storage";
import { isOceanName } from "@/lib/oceanName";
import { DEFAULT_COLOR, DEFAULT_STYLE } from "@/lib/types";
import { formatClock } from "@/lib/formatTime";

type HostBlob = {
  code: string;
  time: TimeLimit;
  level: Level;
  punctuation?: boolean;
  numbers?: boolean;
  goal?: "time" | "words";
  fillAi: boolean;
};

function readHost(code: string): HostBlob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("lostseahorse.host");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HostBlob;
    if (parsed.code !== code) return null;
    if (!isTimeLimit(parsed.time) || !isLevel(parsed.level)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function RoomScreen({
  code,
  isHost,
  stranger,
}: {
  code: string;
  isHost: boolean;
  stranger: boolean;
}) {
  const router = useRouter();
  const { save, ready } = useSave();
  const { resolvedTheme } = useTheme();
  const valid = isValidRoomCode(code);
  const room = useRaceRoom(valid ? code : null);
  const joined = useRef(false);
  const awarded = useRef(false);
  const [localEndsAt, setLocalEndsAt] = useState(0);
  const [clockPassage, setClockPassage] = useState("");

  useEffect(() => {
    if (!valid || joined.current || !room.connected) return;
    if (!ready || !isOceanName(save.name)) return;
    joined.current = true;
    const host = isHost ? readHost(code) : null;
    room.send({
      type: "join",
      name: save.name,
      style: DEFAULT_STYLE,
      color: DEFAULT_COLOR,
      mode: stranger ? "stranger" : "friends",
      fillAi: host?.fillAi,
      settings: host
        ? {
            time: host.time,
            level: host.level,
            punctuation: host.punctuation === true,
            numbers: host.numbers === true,
            goal: host.goal === "words" ? "words" : "time",
          }
        : undefined,
    });
  }, [code, isHost, ready, room, save.name, stranger, valid]);

  const status = room.state?.status;
  const passage = room.state?.passage ?? "";
  if (clockPassage !== passage) {
    setClockPassage(passage);
    setLocalEndsAt(0);
  }

  const typing = useTypingSession({
    passage,
    active: status === "racing" || status === "countdown",
    onKey: (key) => {
      room.sendTyped(key);
      if (key.length === 1 && !localEndsAt && room.state) {
        setLocalEndsAt(Date.now() + room.state.settings.time * 1000);
      }
    },
    onFinish: () => room.send({ type: "finish" }),
  });

  const youResult = room.results?.find((row) => row.id === room.youId);

  useEffect(() => {
    if (!room.results || awarded.current || !youResult) return;
    awarded.current = true;
    updateWpm(youResult.wpm);
  }, [room.results, youResult]);

  const [now, setNow] = useState(0);
  useEffect(() => {
    if (status !== "racing") return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [status]);
  const endsAt = room.state?.endsAt || localEndsAt;
  const left =
    endsAt && now
      ? Math.max(0, endsAt - now)
      : (room.state?.settings.time ?? 0) * 1000;

  const theme: "light" | "dark" =
    resolvedTheme === "light" ? "light" : "dark";
  const share = useMemo(
    () => ({
      name: save.name,
      wpm: youResult?.wpm ?? 0,
      acc: youResult?.accuracy ?? 0,
      mode: (room.state?.mode === "stranger" ? "stranger" : "friends") as
        | "stranger"
        | "friends",
      place: youResult?.place ?? 0,
      theme,
      style: DEFAULT_STYLE,
      color: DEFAULT_COLOR,
    }),
    [room.state?.mode, save.name, theme, youResult],
  );

  if (!valid) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="font-display text-3xl italic">This room does not exist.</p>
      </Card>
    );
  }

  if (room.error) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="font-display text-3xl italic">{room.error}</p>
      </Card>
    );
  }

  if (!ready || !isOceanName(save.name)) {
    return (
      <p className="text-center text-muted">Drifting into the room…</p>
    );
  }

  if (room.results && youResult) {
    return (
      <ResultBoard
        mode={share.mode}
        share={share}
        onAgain={() => {
          if (stranger) router.push("/race");
          else router.push("/friends");
        }}
        rows={room.results.map((row) => ({
          ...row,
          you: row.id === room.youId,
        }))}
      />
    );
  }

  if (!room.state || room.state.status === "lobby") {
    if (!room.state) {
      return (
        <p className="text-center text-muted">Drifting into the room…</p>
      );
    }
    return (
      <WaitingRoom
        state={room.state}
        onStart={() => room.send({ type: "start" })}
        onFillAi={(on) => room.send({ type: "fillAi", on })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-baseline justify-between text-sm text-muted">
        <span>{endsAt ? room.state.mode : "start typing"}</span>
        <span className="font-sans tabular-nums">
          {formatClock(left / 1000)}
        </span>
      </div>
      <TypingPane
        engine={typing.engine}
        onShift={typing.shift}
        onNeedMore={typing.fillMore}
      />
    </div>
  );
}
