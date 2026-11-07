"use client";

import { useState } from "react";
import { ReplayStage } from "./ReplayStage";
import { ReviewStage } from "./ReviewStage";
import { WpmChart } from "./WpmChart";
import {
  Icons,
  InlineStat,
  type PosterAction,
  PosterSheet,
  ResultsPoster,
} from "@/components/results/ResultsPoster";
import { formatClock } from "@/lib/formatTime";
import type { RunStats } from "@/lib/runStats";
import { DEFAULT_COLOR } from "@/lib/types";

function elapsedLabel(seconds: number) {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return formatClock(seconds);
}

export function SoloResults({
  stats,
  onNew,
  onRepeat,
  onCompete,
  newLabel = "New passage",
  extraActions = [],
  inline = false,
}: {
  stats: RunStats;
  onNew: () => void;
  /** Omit to hide Repeat (e.g. Strangers, where the passage is the server's). */
  onRepeat?: () => void;
  /** Omit to hide Compete. */
  onCompete?: () => void;
  newLabel?: string;
  /** Extra buttons after Replay/Review (Strangers adds Lobby). */
  extraActions?: PosterAction[];
  /** In page flow instead of full screen (Strangers results scroll). */
  inline?: boolean;
}) {
  const [sheet, setSheet] = useState<null | "replay" | "review">(null);
  const testType = `${stats.goal === "words" ? "words" : "time"} ${
    stats.setTime > 0 ? stats.setTime : "∞"
  }`;
  const testHint = [
    stats.source === "custom" ? "your passage" : stats.level,
    stats.extras.punctuation ? "punctuation" : null,
    stats.extras.numbers ? "numbers" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ResultsPoster
      inline={inline}
      color={DEFAULT_COLOR}
      wpm={stats.wpm}
      wpmHint="Words per minute, correct characters only"
      accuracy={stats.accuracy}
      chart={<WpmChart samples={stats.samples} marks={stats.marks} />}
      stats={
        <>
          <InlineStat label="test" value={testType} hint={testHint} />
          <InlineStat label="raw" value={stats.rawWpm} hint="Raw WPM: every keystroke, errors included" />
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
            hint="correct / incorrect / extra / missed"
          />
          <InlineStat label="consistency" value={`${stats.consistency}%`} hint="How even your speed stayed across the run" />
          <InlineStat label="time" value={elapsedLabel(stats.elapsed)} hint="Time spent typing" />
          <InlineStat label="words" value={stats.words} hint="Words typed" />
        </>
      }
      primary={{ key: "new", label: newLabel, onClick: onNew }}
      actions={[
        ...(onRepeat
          ? [{ key: "repeat", label: "Repeat", icon: Icons.repeat, onClick: onRepeat }]
          : []),
        ...(onCompete
          ? [
              {
                key: "compete",
                label: "Compete",
                icon: Icons.ghost,
                onClick: onCompete,
                disabled: stats.ghost.length < 2,
              },
            ]
          : []),
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
        ...extraActions,
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
  );
}
