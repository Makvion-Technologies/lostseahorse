"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { ResultBoard } from "@/components/typing/ResultBoard";
import { TypingPane } from "@/components/typing/TypingPane";
import { useTypingSession } from "@/hooks/useTypingSession";
import { generateWords } from "@/lib/generatePassage";
import { planktonForPractice } from "@/lib/plankton";
import { addPlankton, updateWpm } from "@/lib/storage";
import { calcAccuracy, calcWpm } from "@/lib/wpm";
import { loadSetup, saveSetup } from "@/lib/setup";
import { formatClock } from "@/lib/formatTime";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CustomTimeModal } from "@/components/ui/CustomTimeModal";
import { customTimeSlot } from "@/components/ui/ClockGlyph";
import {
  DEFAULT_COLOR,
  DEFAULT_STYLE,
  LEVELS,
  TIMES,
  isPresetTime,
  type Level,
  type TimeLimit,
} from "@/lib/types";

type Phase = "racing" | "results";

export function PracticeScreen() {
  const { resolvedTheme } = useTheme();
  const client = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [time, setTime] = useState<TimeLimit>(() => loadSetup().time);
  const [level, setLevel] = useState<Level>(() => loadSetup().level);
  const [phase, setPhase] = useState<Phase>("racing");
  const [passage, setPassage] = useState("");
  const [endsAt, setEndsAt] = useState(0);
  const [left, setLeft] = useState(() => loadSetup().time * 1000);
  const [result, setResult] = useState<{
    wpm: number;
    accuracy: number;
    finished: boolean;
    plankton: number;
  } | null>(null);
  const done = useRef(false);
  const startedAtRef = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [timeOpen, setTimeOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const levelRef = useRef(level);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  if (client && !passage) {
    const stored = loadSetup();
    if (stored.time !== time) setTime(stored.time);
    if (stored.level !== level) setLevel(stored.level);
    setLeft(stored.time > 0 ? stored.time * 1000 : 0);
    setPassage(
      generateWords({
        level: stored.level,
        count: 120,
        rng: Math.random,
      }).join(" "),
    );
  }

  const begin = useCallback(
    (opts?: {
      time?: TimeLimit;
      level?: Level;
      passage?: string;
      regen?: boolean;
    }) => {
      const nextTime = opts?.time ?? time;
      const nextLevel = opts?.level ?? level;
      if (opts?.time) setTime(opts.time);
      if (opts?.level) setLevel(opts.level);
      saveSetup(nextTime, nextLevel);
      done.current = false;
      startedAtRef.current = 0;
      setRunning(false);
      setEndsAt(0);
      setLeft(nextTime > 0 ? nextTime * 1000 : 0);
      setResult(null);
      setAttempt((n) => n + 1);
      setPhase("racing");
      if (opts?.passage) {
        setPassage(opts.passage);
      } else if (opts?.regen || opts?.level) {
        setPassage(
          generateWords({
            level: nextLevel,
            count: 120,
            rng: Math.random,
          }).join(" "),
        );
      }
    },
    [level, time],
  );

  const finish = useCallback((opts: {
    correctChars: number;
    totalChars: number;
    finished: boolean;
  }) => {
    if (done.current) return;
    done.current = true;
    const started = startedAtRef.current || Date.now();
    const raw = Math.max(1 / 60, (Date.now() - started) / 1000);
    const elapsed = time > 0 ? Math.min(time, raw) : raw;
    const wpm = calcWpm(opts.correctChars, elapsed / 60);
    const accuracy = calcAccuracy(opts.correctChars, opts.totalChars);
    const plankton = planktonForPractice(opts.finished);
    updateWpm(wpm);
    if (plankton) addPlankton(plankton);
    setResult({
      wpm,
      accuracy,
      finished: opts.finished,
      plankton,
    });
    setPhase("results");
  }, [time]);

  const armClock = useCallback(() => {
    if (startedAtRef.current) return;
    const now = Date.now();
    startedAtRef.current = now;
    setRunning(true);
    if (time > 0) {
      setEndsAt(now + time * 1000);
      setLeft(time * 1000);
    } else {
      setEndsAt(0);
      setLeft(0);
    }
  }, [time]);

  const typing = useTypingSession({
    passage,
    resetKey: attempt,
    infinite: true,
    moreWords: () =>
      generateWords({
        level: levelRef.current,
        count: 120,
        rng: Math.random,
      }),
    active: phase === "racing" && Boolean(passage) && !timeOpen,
    onKey: (key) => {
      if (key.length === 1) armClock();
    },
  });

  useEffect(() => {
    if (phase !== "racing" || !running) return;
    if (time === 0) {
      const id = window.setInterval(() => {
        setLeft(Date.now() - startedAtRef.current);
      }, 100);
      return () => window.clearInterval(id);
    }
    if (!endsAt) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, endsAt - Date.now());
      setLeft(remaining);
      if (remaining <= 0) {
        const engine = typing.engineRef.current;
        finish({
          correctChars: engine.correctChars,
          totalChars: engine.totalChars,
          finished: startedAtRef.current !== 0,
        });
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [finish, phase, endsAt, running, time, typing.engineRef]);

  useEffect(() => {
    if (phase !== "racing" || time !== 0 || timeOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!startedAtRef.current || done.current) return;
      event.preventDefault();
      const engine = typing.engineRef.current;
      finish({
        correctChars: engine.correctChars,
        totalChars: engine.totalChars,
        finished: true,
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, phase, time, timeOpen, typing.engineRef]);

  const theme: "light" | "dark" =
    resolvedTheme === "light" ? "light" : "dark";

  const share = useMemo(
    () => ({
      name: "solo",
      wpm: result?.wpm ?? 0,
      acc: result?.accuracy ?? 0,
      mode: "practice" as const,
      place: 0,
      theme,
      style: DEFAULT_STYLE,
      color: DEFAULT_COLOR,
    }),
    [result, theme],
  );

  const controls = (
    <div className="flex items-center gap-3 sm:gap-6">
      <SegmentedControl
        ariaLabel="Time"
        layoutId="solo-time"
        className="flex-1"
        value={isPresetTime(time) ? time : "custom"}
        options={[
          ...TIMES.map((value) => ({
            value: value as number | "custom",
            label: String(value),
          })),
          {
            value: "custom" as const,
            label: customTimeSlot(time),
            ariaLabel: isPresetTime(time)
              ? "Custom time"
              : time === 0
                ? "No limit"
                : `${time} seconds, custom time`,
          },
        ]}
        onChange={(value) => {
          if (value === "custom") {
            setTimeOpen(true);
            return;
          }
          if (value === time) return;
          begin({ time: value, regen: false });
        }}
      />
      <SegmentedControl
        ariaLabel="Level"
        layoutId="solo-level"
        className="flex-1"
        value={level}
        options={LEVELS.map((value) => ({
          value,
          label: value,
        }))}
        onChange={(value) => {
          if (value === level) return;
          begin({ level: value });
        }}
      />
    </div>
  );

  const timeModal = (
    <CustomTimeModal
      open={timeOpen}
      current={time}
      onClose={() => setTimeOpen(false)}
      onApply={(seconds) => begin({ time: seconds, regen: false })}
    />
  );

  const clock = (
    <p className="text-center font-sans text-3xl tabular-nums tracking-wide sm:text-4xl">
      {time === 0 && !running
        ? "∞"
        : formatClock(time === 0 || endsAt ? left / 1000 : time)}
    </p>
  );

  if (phase === "results" && result) {
    return (
      <div className="flex flex-col gap-10">
        {controls}
        {clock}
        {timeModal}
        <ResultBoard
          mode="practice"
          plankton={result.plankton}
          share={share}
          onAgain={() => begin({ regen: true })}
          onRepeat={() => begin({ passage, regen: false })}
          rows={[
            {
              id: "you",
              name: "",
              style: DEFAULT_STYLE,
              color: DEFAULT_COLOR,
              wpm: result.wpm,
              accuracy: result.accuracy,
              place: 1,
              finished: result.finished,
              you: true,
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {controls}
      {clock}
      {timeModal}
      {passage ? (
        <TypingPane
          engine={typing.engine}
          onShift={typing.shift}
          onNeedMore={typing.fillMore}
          onRefresh={() => begin({ regen: true })}
        />
      ) : null}
    </div>
  );
}
