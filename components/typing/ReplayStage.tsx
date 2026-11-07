"use client";

import { useEffect, useRef, useState } from "react";

import { TypingPane } from "./TypingPane";
import { SheetCloseButton } from "@/components/results/ResultsPoster";
import { typingColumnWidth } from "@/components/site/SiteShell";
import { applyKey, createEngine, type TypingEngine } from "@/lib/typing";
import { formatClock } from "@/lib/formatTime";
import type { ReplayEvent } from "@/lib/runStats";
import type { GoalMode } from "@/lib/types";

function cloneEngine(live: TypingEngine): TypingEngine {
  return {
    ...live,
    committed: [...live.committed],
    words: live.words,
  };
}

export function ReplayStage({
  passage,
  events,
  setTime,
  goal,
  title = "Replay",
  onClose,
}: {
  title?: string;
  onClose?: () => void;
  passage: string;
  events: ReplayEvent[];
  setTime: number;
  goal: GoalMode;
}) {
  const [engine, setEngine] = useState(() => createEngine(passage, 0, false));
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [paneWidth, setPaneWidth] = useState<number | null>(null);
  const playRef = useRef(false);

  useEffect(() => {
    const measure = () =>
      setPaneWidth(typingColumnWidth(document.documentElement.clientWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const liveRef = useRef<TypingEngine>(createEngine(passage, 0, false));
  const indexRef = useRef(0);
  const originRef = useRef(0);
  const elapsedRef = useRef(0);

  const duration =
    goal === "time" && setTime > 0
      ? setTime
      : Math.max(events[events.length - 1]?.t ?? 0, 0);

  useEffect(() => {
    if (!playing) return;
    playRef.current = true;
    const tick = () => {
      if (!playRef.current) return;
      const t = (Date.now() - originRef.current) / 1000;
      elapsedRef.current = t;
      setElapsed(t);
      const live = liveRef.current;
      let dirty = false;
      while (
        indexRef.current < events.length &&
        events[indexRef.current]!.t <= t
      ) {
        applyKey(live, events[indexRef.current]!.key);
        indexRef.current += 1;
        dirty = true;
      }
      if (dirty) setEngine(cloneEngine(live));
      if (t >= duration && indexRef.current >= events.length) {
        elapsedRef.current = duration;
        setElapsed(duration);
        playRef.current = false;
        setPlaying(false);
        setDone(true);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      playRef.current = false;
    };
  }, [duration, events, playing]);

  const startFromZero = () => {
    playRef.current = false;
    const fresh = createEngine(passage, Date.now(), false);
    liveRef.current = fresh;
    indexRef.current = 0;
    elapsedRef.current = 0;
    originRef.current = Date.now();
    setEngine(cloneEngine(fresh));
    setDone(false);
    setElapsed(0);
    setPlaying(true);
  };

  const toggle = () => {
    if (done) {
      startFromZero();
      return;
    }
    if (playing) {
      elapsedRef.current = (Date.now() - originRef.current) / 1000;
      playRef.current = false;
      setElapsed(elapsedRef.current);
      setPlaying(false);
      return;
    }
    originRef.current = Date.now() - elapsedRef.current * 1000;
    setPlaying(true);
  };

  const clock =
    goal === "words"
      ? setTime > 0
        ? `${engine.lifetimeWords}/${setTime}`
        : String(engine.lifetimeWords)
      : setTime > 0
        ? formatClock(Math.max(0, setTime - elapsed))
        : formatClock(elapsed);

  return (
    <div className="flex flex-col gap-4 pb-8 sm:gap-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          type="button"
          aria-label={done ? "Retry replay" : playing ? "Pause replay" : "Play replay"}
          onClick={toggle}
          className="justify-self-start flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-foam text-ink ring-1 ring-line outline-none hover:text-teal focus-visible:ring-2 focus-visible:ring-teal"
        >
          {done ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                d="M20 12a8 8 0 1 1-2.2-5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M20 4.5V8h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : playing ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M7 5h3.2v14H7V5zm6.8 0H17v14h-3.2V5z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M8 5.5v13l12-6.5-12-6.5z" fill="currentColor" />
            </svg>
          )}
        </button>
        <div className="flex flex-col items-center gap-1">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
          <p className="text-center font-sans text-3xl tabular-nums tracking-wide sm:text-4xl">
            {clock}
          </p>
        </div>
        {onClose ? <SheetCloseButton onClose={onClose} /> : <span aria-hidden />}
      </div>
      <div
        className="max-w-full"
        style={paneWidth ? { width: paneWidth } : undefined}
      >
        <TypingPane engine={engine} chrome={false} />
      </div>
    </div>
  );
}
