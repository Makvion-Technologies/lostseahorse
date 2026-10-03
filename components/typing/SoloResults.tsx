"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ReplayStage } from "./ReplayStage";
import { WpmChart } from "./WpmChart";
import { formatClock } from "@/lib/formatTime";
import type { RunStats } from "@/lib/runStats";

function CountUp({ value, reduce }: { value: number; reduce: boolean | null }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce, value]);
  return <>{shown}</>;
}

function elapsedLabel(seconds: number) {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return formatClock(seconds);
}

function Hero({
  label,
  value,
  teal,
}: {
  label: string;
  value: ReactNode;
  teal?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p
        className={
          teal
            ? "mt-3 font-display text-7xl italic leading-none text-teal sm:text-8xl"
            : "mt-3 font-display text-4xl italic leading-none sm:text-5xl"
        }
      >
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-1 truncate font-display text-2xl italic leading-none">
        {value}
      </p>
    </div>
  );
}

export function SoloResults({
  stats,
  onNew,
  onRepeat,
  onCompete,
}: {
  stats: RunStats;
  onNew: () => void;
  onRepeat: () => void;
  onCompete: () => void;
}) {
  const reduce = useReducedMotion();
  const [replayOpen, setReplayOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="px-4 sm:px-10">
        <div className="grid grid-cols-5 items-end gap-4 py-8 sm:gap-8 sm:py-10">
          <Hero label="time" value={elapsedLabel(stats.elapsed)} />
          <Hero
            label="raw"
            value={<CountUp value={stats.rawWpm} reduce={reduce} />}
          />
          <Hero
            teal
            label="wpm"
            value={<CountUp value={stats.wpm} reduce={reduce} />}
          />
          <Hero
            label="accuracy"
            value={
              <>
                <CountUp value={stats.accuracy} reduce={reduce} />%
              </>
            }
          />
          <Hero label="consistency" value={`${stats.consistency}%`} />
        </div>
        <div className="h-px w-full bg-line" />
        <AnimatePresence initial={false}>
          {!replayOpen ? (
            <motion.div
              key="actions"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-center gap-3 py-8 sm:gap-4 sm:py-10">
                <Button variant="ghost" className="rounded-xl" onClick={onNew}>
                  New
                </Button>
                <Button variant="ghost" className="rounded-xl" onClick={onRepeat}>
                  Repeat
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={onCompete}
                  disabled={stats.ghost.length < 2}
                >
                  Compete
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setReplayOpen(true)}
                  disabled={stats.replay.length < 1}
                >
                  Replay
                </Button>
              </div>
            </motion.div>
          ) : null}
          {replayOpen ? (
            <motion.div
              key="replay"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <ReplayStage
                passage={stats.replayPassage}
                events={stats.replay}
                setTime={stats.setTime}
                goal={stats.goal}
                onClose={() => setReplayOpen(false)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="relative flex h-[22rem] w-full flex-col rounded-3xl border border-line bg-foam px-3 py-4 sm:h-[28rem] sm:px-4">
        <div className="pointer-events-none absolute top-4 right-6 z-10 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-coral" />
            Error
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber" />
            Missed
          </span>
        </div>
        <div className="min-h-0 flex-1">
          <WpmChart samples={stats.samples} marks={stats.marks} />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-x-6 gap-y-4 rounded-3xl border border-line bg-foam px-6 py-4">
        <Metric label="words typed" value={stats.words} />
        <Metric label="chars typed" value={stats.totalChars} />
        <Metric label="correct chars" value={stats.correct} />
        <Metric label="wrong chars" value={stats.incorrect} />
        <Metric label="missed chars" value={stats.missed} />
      </div>
    </div>
  );
}
