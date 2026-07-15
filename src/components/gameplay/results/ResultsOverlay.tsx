"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/game/state/useGameStore";
import { RESULTS_STAT_STAGGER_MS } from "@/game/constants/results";
import {
  ResultsHeroStat,
  ResultsSectionTitle,
  ResultsStatRow,
  type StatTone,
} from "./ResultsStatRow";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { audioManager } from "@/game/audio/AudioManager";
import type { GameResults } from "@/game/types/Results";

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function formatReaction(seconds: number): string {
  if (seconds <= 0) return "—";
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  return `${seconds.toFixed(2)} s`;
}

type RowDef = {
  label: string;
  value: number | string;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  isText?: boolean;
  tone?: StatTone;
};

/**
 * Results modal: 3 hero boxes + clean label/value sections (no scroll).
 */
export function ResultsOverlay() {
  const results = useGameStore((s) => s.results);
  const restartRound = useGameStore((s) => s.restartRound);
  const restartGame = useGameStore((s) => s.restartGame);
  const reduced = useReducedMotion();
  const playAgainRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => playAgainRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        audioManager.playUiClick();
        restartRound();
      } else if (e.key === "Escape") {
        e.preventDefault();
        audioManager.playUiClick();
        restartGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [restartRound, restartGame]);

  if (!results) return null;

  return (
    <ResultsPanel
      results={results}
      reduced={reduced}
      playAgainRef={playAgainRef}
      onPlayAgain={() => {
        audioManager.playUiClick();
        restartRound();
      }}
      onChooseMode={() => {
        audioManager.playUiClick();
        restartGame();
      }}
    />
  );
}

function ResultsPanel({
  results,
  reduced,
  playAgainRef,
  onPlayAgain,
  onChooseMode,
}: {
  results: GameResults;
  reduced: boolean;
  playAgainRef: React.RefObject<HTMLButtonElement | null>;
  onPlayAgain: () => void;
  onChooseMode: () => void;
}) {
  const accuracyTone: StatTone =
    results.accuracy >= 90
      ? "good"
      : results.accuracy >= 75
        ? "accent"
        : results.accuracy >= 60
          ? "warn"
          : "bad";

  const performance: RowDef[] = [
    {
      label: "Correct words",
      value: results.correctWords,
      tone: "good",
    },
    {
      label: "Missed words",
      value: results.wordsMissed,
      tone: results.wordsMissed > 0 ? "bad" : "good",
    },
    {
      label: "Words destroyed",
      value: results.wordsDestroyed,
      tone: "accent",
    },
    {
      label: "Highest combo",
      value: results.longestCombo,
      prefix: "x",
      tone: "combo",
    },
  ];

  const keystrokes: RowDef[] = [
    {
      label: "Correct characters",
      value: results.correctCharacters,
      tone: "good",
    },
    {
      label: "Incorrect keystrokes",
      value: results.incorrectKeystrokes,
      tone: results.incorrectKeystrokes > 0 ? "bad" : "good",
    },
  ];

  const session: RowDef[] = [
    {
      label: "Longest word",
      value: results.longestWord
        ? `${results.longestWord} (${results.longestWordLength})`
        : "—",
      isText: true,
    },
    {
      label: "Avg. reaction time",
      value: formatReaction(results.averageReactionTime),
      isText: true,
    },
    {
      label: "Time played",
      value: formatTime(results.timePlayed),
      isText: true,
    },
  ];

  const stagger = reduced ? 0 : RESULTS_STAT_STAGGER_MS * 0.55;
  let delay = 140;

  const nextDelay = () => {
    const d = delay;
    delay += stagger;
    return d;
  };

  const reasonLabel =
    results.gameOverReason === "timer"
      ? "Time's up"
      : results.gameOverReason === "health"
        ? "Seahorse defeated"
        : "Practice complete";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0.12 : 0.4 }}
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/60 px-3 py-4 backdrop-blur-md sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-title"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(34,211,238,0.1), transparent 70%)",
        }}
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: reduced ? 0.12 : 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-b from-slate-900/95 via-slate-950/96 to-[#021018] p-5 shadow-[0_0_70px_-18px_rgba(34,211,238,0.4)] sm:max-w-xl sm:p-6"
      >
        <div
          className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent"
          aria-hidden
        />

        {/* Header */}
        <div className="text-center">
          <p className="text-[10px] font-medium tracking-[0.2em] text-cyan-300/45 uppercase">
            Session Complete
            <span className="mx-2 text-cyan-500/25">·</span>
            <span className="tracking-normal text-cyan-200/35 normal-case">
              {reasonLabel}
            </span>
          </p>

          <h2
            id="results-title"
            className="mt-2 font-display text-2xl font-semibold tracking-wide text-cyan-50 sm:text-3xl"
          >
            {results.performanceTitle}
          </h2>

          <p className="mx-auto mt-1.5 max-w-md text-center text-xs leading-snug text-cyan-100/45 sm:text-sm">
            {results.sessionMessage}
          </p>
        </div>

        {/* Main metrics — only 3 boxes */}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <ResultsHeroStat
            label="WPM"
            value={results.wpm}
            tone="accent"
            delayMs={reduced ? 0 : 100}
          />
          <ResultsHeroStat
            label="Peak WPM"
            value={results.peakWpm}
            tone="accent"
            delayMs={reduced ? 0 : 160}
          />
          <ResultsHeroStat
            label="Accuracy"
            value={results.accuracy}
            decimals={1}
            suffix="%"
            tone={accuracyTone}
            delayMs={reduced ? 0 : 220}
          />
        </div>

        {/* Detail sections — Performance | Keystrokes side by side, then Session */}
        <div className="mt-4 sm:mt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-0">
            {/* Performance */}
            <div className="min-w-0 sm:pr-5">
              <ResultsSectionTitle delayMs={reduced ? 0 : 260}>
                Performance
              </ResultsSectionTitle>
              {performance.map((row) => (
                <ResultsStatRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  prefix={row.prefix}
                  tone={row.tone}
                  delayMs={nextDelay()}
                />
              ))}
            </div>

            {/* Vertical divider (desktop) / horizontal (mobile) */}
            <div
              className="relative hidden sm:block"
              aria-hidden
            >
              <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-400/35 to-transparent" />
              <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.55)]" />
            </div>
            <div
              className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent sm:hidden"
              aria-hidden
            />

            {/* Keystrokes */}
            <div className="min-w-0 sm:pl-5">
              <ResultsSectionTitle delayMs={reduced ? 0 : 320}>
                Keystrokes
              </ResultsSectionTitle>
              {keystrokes.map((row) => (
                <ResultsStatRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  tone={row.tone}
                  delayMs={nextDelay()}
                />
              ))}
            </div>
          </div>

          <ResultsSectionTitle delayMs={nextDelay()}>
            Session
          </ResultsSectionTitle>
          {session.map((row) => (
            <ResultsStatRow
              key={row.label}
              label={row.label}
              value={row.value}
              isText={row.isText}
              tone={row.tone}
              delayMs={nextDelay()}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <Button
            ref={playAgainRef}
            variant="primary"
            className="min-w-[10rem]"
            onClick={onPlayAgain}
          >
            Play Again
          </Button>
          <Button
            variant="ghost"
            className="min-w-[10rem]"
            onClick={onChooseMode}
          >
            Back to Home
          </Button>
        </div>

        <p className="mt-3 text-center text-[10px] tracking-wide text-cyan-100/25">
          Enter · Play Again &nbsp;·&nbsp; Esc · Back to Home
        </p>
      </motion.div>
    </motion.div>
  );
}
