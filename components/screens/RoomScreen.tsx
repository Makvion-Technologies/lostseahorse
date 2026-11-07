"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { FriendsLobby } from "@/components/friends/FriendsLobby";
import { TypingPane } from "@/components/typing/TypingPane";
import { Card } from "@/components/ui/Card";
import { useRaceRoom } from "@/hooks/useRaceRoom";
import { useSave } from "@/hooks/useSave";
import { useTypingSession } from "@/hooks/useTypingSession";
import { useTypingFocus } from "@/hooks/useTypingFocus";
import { isValidRoomCode } from "@/lib/roomCode";
import { isLevel, isTimeLimit, type Level, type TimeLimit } from "@/lib/types";
import { updateWpm } from "@/lib/storage";
import { NameField, NameGate, migratedNick, useNameField } from "@/components/profile/NamePicker";
import { PrimaryButton } from "@/components/lobby/HomeParts";
import { useProfile } from "@/hooks/useProfile";
import { VsLine } from "@/components/stranger/NameRoll";
import { Confetti } from "@/components/results/Confetti";
import { podiumSize } from "@/lib/placings";
import { vsLabel } from "@/lib/vsLabel";
import { DEFAULT_COLOR, DEFAULT_STYLE } from "@/lib/types";
import { formatClock } from "@/lib/formatTime";
import { calcWpm } from "@/lib/wpm";
import {
  buildRunStats,
  closeRunMarks,
  recordKeyMarks,
  type ChartMark,
  type GhostFrame,
  type ReplayEvent,
  type RunStats,
  type WpmSample,
} from "@/lib/runStats";
import { typedWordsOf } from "@/lib/typing";
import { StrangerResults } from "@/components/stranger/StrangerResults";

type HostBlob = {
  code: string;
  time: TimeLimit;
  level: Level;
  punctuation?: boolean;
  numbers?: boolean;
  goal?: "time" | "words";
  fillAi: boolean;
  /** Friends room size (2..10). */
  max?: number;
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

function RoomInner({
  code,
  isHost,
  stranger,
}: {
  code: string;
  isHost: boolean;
  stranger: boolean;
}) {
  const router = useRouter();
  const { ready, save } = useSave();
  const profile = useProfile();
  const me = profile.profile;
  const reduceMotion = useReducedMotion();
  const first = useNameField({ mode: "first", initial: migratedNick(save) });
  const valid = isValidRoomCode(code);
  const room = useRaceRoom(valid ? code : null);
  const joined = useRef(false);
  const awarded = useRef(false);
  const [localEndsAt, setLocalEndsAt] = useState(0);
  const [clockPassage, setClockPassage] = useState("");
  const [raceSamples, setRaceSamples] = useState<WpmSample[]>([]);
  const raceStart = useRef(0);
  // Same per-key recording as Solo, so Strangers get the identical results.
  const marksRef = useRef<ChartMark[]>([]);
  const ghostRef = useRef<GhostFrame[]>([]);
  const replayRef = useRef<ReplayEvent[]>([]);
  const [strangerStats, setStrangerStats] = useState<RunStats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);

  useEffect(() => {
    if (!valid || joined.current || !room.connected) return;
    if (!ready || !me || !room.state) return;
    // An invite to a room everyone has left: don't silently become its host.
    if (!isHost && !stranger && room.state.status === "lobby" && !room.state.players.some((p) => p.connected)) return;
    joined.current = true;
    const host = isHost ? readHost(code) : null;
    room.send({
      type: "join",
      pid: me.id,
      style: DEFAULT_STYLE,
      color: DEFAULT_COLOR,
      mode: stranger ? "stranger" : "friends",
      fillAi: stranger ? host?.fillAi : false,
      max: host?.max,
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
  }, [code, isHost, ready, room, me, stranger, valid]);

  // Before joining: what an invite link leads to.
  const inRoom = !!room.state && !!me && room.state.players.some((p) => p.id === me.id);
  const pre = room.state && !inRoom ? room.state : null;
  const closed = !!pre && !isHost && !stranger && pre.status === "lobby" && !pre.players.some((p) => p.connected);
  const moving = !!pre && !inRoom && pre.status !== "lobby";
  const isFull = !!pre && !inRoom && pre.status === "lobby" && !!pre.maxPlayers && pre.players.length >= pre.maxPlayers;
  const inviteHost = pre?.players.find((p) => p.id === pre.hostId)?.name ?? null;

  const status = room.state?.status;
  const passage = room.state?.passage ?? "";
  if (clockPassage !== passage) {
    setClockPassage(passage);
    setLocalEndsAt(0);
    setRaceSamples([]);
    setStrangerStats(null);
    setStatsFailed(false);
  }

  const typing = useTypingSession({
    passage,
    // Everyone starts together after the server countdown.
    active: status === "racing",
    onKey: (key, engine) => {
      room.sendTyped(key);
      if (!raceStart.current) raceStart.current = Date.now();
      const t = (Date.now() - raceStart.current) / 1000;
      ghostRef.current.push({ t, word: engine.lifetimeWords, letter: engine.typed.length });
      replayRef.current.push({ t, key });
      marksRef.current = recordKeyMarks(marksRef.current, key, engine, t);
      if (key.length === 1 && !localEndsAt && room.state) {
        setLocalEndsAt(Date.now() + room.state.settings.time * 1000);
      }
    },
    onFinish: () => room.send({ type: "finish" }),
  });

  // Sample the player's speed once a second so the results graph has data.
  const latestEngine = useRef(typing.engine);
  useEffect(() => {
    latestEngine.current = typing.engine;
  });
  useEffect(() => {
    if (status === "countdown") {
      raceStart.current = 0;
      marksRef.current = [];
      ghostRef.current = [];
      replayRef.current = [];
    }
    if (status !== "racing") return;
    const id = window.setInterval(() => {
      if (!raceStart.current) return;
      const t = (Date.now() - raceStart.current) / 1000;
      const wpm = calcWpm(latestEngine.current.netChars, t / 60);
      const raw = calcWpm(latestEngine.current.totalChars, t / 60);
      setRaceSamples((prev) => [...prev, { t: Math.round(t), wpm, raw }]);
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

  // Same focus mode as Solo: hide the vs line and navbar once typing starts.
  const focus = useTypingFocus(status === "racing" && localEndsAt > 0);

  const youResult = room.results?.find((row) => row.id === room.youId);
  // Close the graph on the server's official numbers (older servers without
  // `elapsed` just keep the client samples).
  const finalSamples = useMemo(
    () =>
      youResult && Number.isFinite(youResult.elapsed)
        ? [
            ...raceSamples.filter((sample) => sample.t < youResult.elapsed),
            { t: youResult.elapsed, wpm: youResult.wpm, raw: youResult.rawWpm },
          ]
        : raceSamples,
    [raceSamples, youResult],
  );
  const settings = room.state?.settings;
  // Snapshot your run once the server's results arrive (refs are read here,
  // in an effect, not during render).
  useEffect(() => {
    if (!youResult || !settings || strangerStats || statsFailed) return;
    try {
    const engine = latestEngine.current;
    const elapsed = Number.isFinite(youResult.elapsed) ? youResult.elapsed : settings.time;
    const stats = buildRunStats({
      engine,
      elapsed,
      setTime: settings.time,
      goal: settings.goal === "words" ? "words" : "time",
      level: settings.level,
      extras: { punctuation: settings.punctuation === true, numbers: settings.numbers === true },
      source: "generated",
      finished: youResult.finished,
      samples: finalSamples,
      marks: closeRunMarks(marksRef.current, engine, elapsed),
      ghost: ghostRef.current,
      replayPassage: passage,
      replay: replayRef.current,
      typedWords: typedWordsOf(engine),
    });
    // The server's numbers are the official ones (they decide the podium).
    setStrangerStats({
      ...stats,
      wpm: youResult.wpm,
      rawWpm: youResult.rawWpm,
      accuracy: youResult.accuracy,
    });
    } catch {
      // Never leave the player on a blank screen: show results without detail.
      setStatsFailed(true);
    }
  }, [youResult, settings, strangerStats, statsFailed, finalSamples, passage]);

  useEffect(() => {
    if (!room.results) {
      // Friends "race again": the next race awards again.
      awarded.current = false;
      return;
    }
    if (awarded.current || !youResult) return;
    awarded.current = true;
    if (!youResult.flagged) updateWpm(youResult.wpm);
  }, [room.results, youResult]);

  const [now, setNow] = useState(0);
  useEffect(() => {
    if (status !== "racing" && status !== "countdown") return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [status]);
  const serverEndsAt = room.state?.endsAt ? room.state.endsAt - room.offset : 0;
  const endsAt = serverEndsAt || localEndsAt;
  const countdownLeft =
    status === "countdown" && room.state?.countdownEndsAt && now
      ? Math.max(0, room.state.countdownEndsAt - room.offset - now)
      : 0;
  const left =
    endsAt && now
      ? Math.max(0, endsAt - now)
      : (room.state?.settings.time ?? 0) * 1000;

  if (!valid) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="text-xl font-semibold">This room does not exist.</p>
      </Card>
    );
  }

  const gone = room.error ?? (closed ? "This room has closed." : !me && moving ? "Race already moving." : !me && isFull ? "Room is full." : null);
  if (gone) {
    return (
      <div className="mx-auto mt-[8vh] w-full max-w-md rounded-3xl border border-line bg-card p-6 text-center sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Room {code}</p>
        <p className="mt-3 text-xl font-semibold sm:text-2xl">{gone}</p>
        {stranger ? null : (
          <>
            <p className="mt-3 text-sm text-muted">
              Ask your friend for a fresh link, or start your own room.
            </p>
            <Link
              href="/friends"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-teal px-8 font-medium text-abyss outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
            >
              Back to Friends
            </Link>
          </>
        )}
      </div>
    );
  }

  if (!ready || profile.status === "loading" || (!me && !room.state && !profile.offline)) {
    return <p className="text-center text-muted">Drifting into the room…</p>;
  }

  if (!me) {
    const join = () => void first.submit();
    return (
      <>
        {/* The room itself, dimmed and inert behind the name prompt. */}
        <div inert aria-hidden className="pointer-events-none select-none">
          {room.state ? <FriendsLobby state={room.state} youId={undefined} onStart={() => {}} /> : null}
        </div>
        {createPortal(<motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/80 p-4 [--u:clamp(0.8rem,min(0.93vw,1.6dvh),1.42rem)]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-title"
            className="flex w-[min(100%,calc(var(--u)*30))] flex-col gap-[calc(var(--u)*1.1)] rounded-xl border border-line bg-card p-[calc(var(--u)*1.6)] shadow-2xl"
            initial={reduceMotion ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="mb-[calc(var(--u)*1.1)] text-center">
              <h2 id="join-title" className="truncate font-display text-[length:calc(var(--u)*1.9)] leading-tight font-normal tracking-tight text-ink italic">
                {inviteHost ? `Join ${inviteHost}'s room` : "Join this room"}
              </h2>
              <p className="mt-[calc(var(--u)*0.4)] text-[length:calc(var(--u)*0.92)] whitespace-nowrap text-muted">Pick a racer name to hop in.</p>
            </div>
            {profile.offline ? (
              <p role="alert" className="text-center text-sm text-coral">
                Can&apos;t reach the race server.{" "}
                <button type="button" onClick={profile.reload} className="cursor-pointer text-teal underline">
                  Retry
                </button>
              </p>
            ) : null}
            <NameField field={first} label="Racer name" onEnter={join} />
            <PrimaryButton label={first.saving ? "Joining…" : "Join room"} disabled={!first.good || first.saving} onClick={join} />
            <Link href="/friends" className="self-center rounded-xl px-3 py-1 text-[length:calc(var(--u)*0.86)] text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">
              Not now
            </Link>
          </motion.div>
        </motion.div>, document.body)}
      </>
    );
  }

  if (room.results && youResult) {
    const podium =
      room.results.length > 1 &&
      !youResult.flagged &&
      youResult.place >= 1 &&
      youResult.place <= podiumSize(room.results.length);
    const rows = room.results.map((row) => ({ ...row, you: row.id === room.youId }));
    // One frame while your run is snapshotted.
    if (!strangerStats && !statsFailed) return null;
    return (
      <>
        {podium ? <Confetti /> : null}
        {stranger ? (
          <StrangerResults
            rows={rows}
            stats={strangerStats}
            passage={passage}
            settings={room.state?.settings ?? { time: 30, level: "easy" }}
            onNew={() => router.push("/stranger?go=1")}
            onLobby={() => router.push("/stranger")}
          />
        ) : (
          <StrangerResults
            rows={rows}
            stats={strangerStats}
            passage={passage}
            settings={room.state?.settings ?? { time: 30, level: "easy" }}
            newLabel="Race again"
            lobbyLabel="Back to home"
            leaderboard={false}
            onNew={() => room.send({ type: "again" })}
            onLobby={() => router.push("/friends")}
          />
        )}
      </>
    );
  }

  if (!room.state || room.state.status === "lobby") {
    if (!room.state) {
      return (
        <p className="text-center text-muted">Drifting into the room…</p>
      );
    }
    if (stranger) {
      return (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-5" role="status" aria-live="polite">
          <p className="text-center text-xl font-semibold">Racers joining…</p>
          <p className="text-center text-sm text-muted">
            {room.state.players.length} here · starts in a moment
          </p>
          <VsLine me={me.name}>
            <span className="truncate text-teal">
              {vsLabel(room.state.players.filter((p) => p.id !== room.youId).map((p) => p.name)) || "\u2026"}
            </span>
          </VsLine>
        </div>
      );
    }
    return (
      <FriendsLobby
        state={room.state}
        youId={room.youId}
        onStart={() => room.send({ type: "start" })}
      />
    );
  }

  const words = room.state.settings.goal === "words";
    const counting = status === "countdown";
    return (
      // Mirrors Solo's PracticeScreen layout: the vs line sits in the same
      // in-flow slot as Solo's option row, and the clock + passage are centred
      // with the exact same wrapper classes, so both land at the same height.
      <div className="relative flex min-h-[calc(100dvh-10rem)] w-full min-w-0 flex-col sm:min-h-[calc(100dvh-12rem)]">
        <div
          className={
            "relative z-20 flex min-h-10 items-center pt-2 transition-opacity duration-300 motion-reduce:transition-none sm:pt-6 lg:pt-10" +
            (focus.hidden ? " pointer-events-none opacity-0" : "")
          }
          aria-hidden={focus.hidden ? true : undefined}
          inert={focus.hidden}
        >
        <VsLine me={me.name}>
          <span className="truncate text-teal">
            {vsLabel(room.state.players.filter((p) => p.id !== room.youId).map((p) => p.name)) || (stranger ? "a stranger" : "friends")}
          </span>
        </VsLine>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative my-auto flex w-full flex-col gap-6 pt-8 pb-32 sm:gap-10 sm:pt-10 sm:pb-36">
        {words ? (
          <p className="text-center text-sm text-muted">{room.state.settings.time} words</p>
        ) : (
          <p
            role="timer"
            className="text-center font-sans text-[clamp(1.75rem,1.4rem+1.5vw,2.5rem)] leading-none tabular-nums tracking-wide"
          >
            {formatClock((counting ? room.state.settings.time * 1000 : left) / 1000)}
          </p>
        )}
        <div className={counting ? "pointer-events-none opacity-40" : undefined}>
          <TypingPane engine={typing.engine} onShift={typing.shift} onNeedMore={typing.fillMore} />
        </div>
        {counting ? (
          <p
            className="absolute inset-0 flex items-center justify-center font-mono text-7xl tabular-nums text-ink sm:text-8xl"
            role="timer"
            aria-live="assertive"
          >
            {Math.max(1, Math.ceil(countdownLeft / 1000))}
          </p>
        ) : null}
        </div>
        </div>
      </div>
    );
}

export function RoomScreen(props: { code: string; isHost: boolean; stranger: boolean }) {
  // Friends invites ask for a name inline on the room page.
  if (!props.stranger) return <RoomInner {...props} />;
  return (
    <NameGate>
      <RoomInner {...props} />
    </NameGate>
  );
}
