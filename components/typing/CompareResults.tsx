"use client";

import { useState } from "react";
import { ReplayStage } from "./ReplayStage";
import { ReviewStage } from "./ReviewStage";
import { WpmChart } from "./WpmChart";
import { Confetti } from "@/components/results/Confetti";
import {
  Icons,
  InlineStat,
  PosterSheet,
  ResultsPoster,
} from "@/components/results/ResultsPoster";
import type { RunStats } from "@/lib/runStats";
import { DEFAULT_COLOR } from "@/lib/types";

/** Better = higher net WPM; accuracy breaks a tie. */
export function beatPrevious(now: RunStats, prev: RunStats): boolean {
  if (now.wpm !== prev.wpm) return now.wpm > prev.wpm;
  return now.accuracy > prev.accuracy;
}

function Delta({ value, unit = "" }: { value: number; unit?: string }) {
  const v = Math.round(value);
  const tone = v > 0 ? "text-teal" : v < 0 ? "text-coral" : "text-muted";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "±";
  return (
    <span className={`not-italic font-sans font-medium tabular-nums ${tone}`}>
      {sign}
      {Math.abs(v)}
      {unit}
    </span>
  );
}

function Was({ prev, delta, unit }: { prev: string | number; delta: number; unit?: string }) {
  return (
    <span className="flex items-baseline gap-1.5 whitespace-nowrap text-[11px] sm:text-xs text-muted tabular-nums md:text-sm">
      <span>prev {prev}</span>
      <Delta value={delta} unit={unit} />
    </span>
  );
}

export function CompareResults({
  stats,
  previous,
  onNew,
  onTryAgain,
  onRaceThis,
}: {
  stats: RunStats;
  previous: RunStats;
  onNew: () => void;
  onTryAgain: () => void;
  onRaceThis: () => void;
}) {
  const [sheet, setSheet] = useState<null | "replay" | "review">(null);
  const better = beatPrevious(stats, previous);
  const dWpm = stats.wpm - previous.wpm;
  const dAcc = Math.round(stats.accuracy) - Math.round(previous.accuracy);
  const fmt = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v)}`;
  const headline = better
    ? dWpm !== 0
      ? `New best · ${fmt(dWpm)} wpm`
      : `New best · ${fmt(dAcc)}% acc`
    : dWpm !== 0
      ? `Previous run held · ${fmt(dWpm)} wpm`
      : "Previous run held · dead even";

  return (
    <>
      {better ? <Confetti /> : null}
      <ResultsPoster
        color={DEFAULT_COLOR}
        headline={
          <span className="flex flex-col gap-0.5 normal-case tracking-normal">
            <span
              className={`font-display text-[clamp(1rem,0.9rem+0.6vw,1.5rem)] italic leading-tight ${better ? "text-teal" : "text-ink"}`}
            >
              {headline}
            </span>
            {!better ? (
              <span className="hidden text-xs text-muted sm:inline">
                Same passage, same ghost. Run it back.
              </span>
            ) : null}
          </span>
        }
        wpm={stats.wpm}
        wpmHint="Words per minute, correct characters only"
        wpmSub={<Was prev={previous.wpm} delta={dWpm} />}
        accuracy={stats.accuracy}
        accSub={<Was prev={`${Math.round(previous.accuracy)}%`} delta={dAcc} unit="%" />}
        legendExtra={
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded-full bg-muted opacity-60 md:w-5" /> prev
          </span>
        }
        chart={
          <WpmChart
            samples={stats.samples}
            marks={stats.marks}
            ghostSamples={previous.samples}
          />
        }
        stats={
          <>
            <InlineStat
              label="raw"
              value={stats.rawWpm}
              sub={<Was prev={previous.rawWpm} delta={stats.rawWpm - previous.rawWpm} />}
              hint="Raw WPM: every keystroke, errors included"
            />
            <InlineStat
              label="characters"
              value={
                <span className="whitespace-nowrap">
                  <span className="text-teal">{stats.correct}</span>
                  <span className="text-muted">/</span>
                  <span className="text-coral">{stats.incorrect}</span>
                  <span className="text-muted">/</span>
                  {stats.extra}
                  <span className="text-muted">/</span>
                  <span className="text-amber">{stats.missed}</span>
                </span>
              }
              sub={
                <Was
                  prev={previous.correct}
                  delta={stats.correct - previous.correct}
                />
              }
              hint={`correct / incorrect / extra / missed · previous ${previous.correct}/${previous.incorrect}/${previous.extra}/${previous.missed}`}
            />
            <InlineStat
              label="consistency"
              value={`${stats.consistency}%`}
              sub={
                <Was
                  prev={`${previous.consistency}%`}
                  delta={stats.consistency - previous.consistency}
                  unit="%"
                />
              }
              hint="How even your speed stayed across the run"
            />
          </>
        }
        primary={
          better
            ? { key: "race", label: "Race this run", onClick: onRaceThis }
            : { key: "again", label: "Try again", onClick: onTryAgain }
        }
        actions={[
          { key: "new", label: "New", icon: Icons.repeat, onClick: onNew },
          better
            ? { key: "again", label: "Rematch", icon: Icons.ghost, onClick: onTryAgain }
            : { key: "race", label: "Race this", icon: Icons.ghost, onClick: onRaceThis, disabled: stats.ghost.length < 2 },
          {
            key: "replay",
            label: "Replay",
            icon: Icons.play,
            onClick: () => setSheet("replay"),
            disabled: stats.replay.length < 1,
          },
          {
            key: "review",
            label: "Review",
            icon: Icons.chart,
            onClick: () => setSheet("review"),
            disabled: stats.typedWords.length < 1,
          },
        ]}
        overlay={
          sheet === "replay" ? (
            <PosterSheet key="replay" title="Replay" hideHeader wide onClose={() => setSheet(null)}>
              <ReplayStage
                title="Replay"
                onClose={() => setSheet(null)}
                key={stats.replayPassage}
                passage={stats.replayPassage}
                events={stats.replay}
                setTime={stats.setTime}
                goal={stats.goal}
              />
            </PosterSheet>
          ) : sheet === "review" ? (
            <PosterSheet key="review" title="Review" hideHeader wide onClose={() => setSheet(null)}>
              <ReviewStage
                title="Review"
                onClose={() => setSheet(null)}
                words={stats.typedWords}
                level={stats.level}
                source={stats.source}
                setTime={stats.setTime}
                goal={stats.goal}
              />
            </PosterSheet>
          ) : null
        }
      />
    </>
  );
}
