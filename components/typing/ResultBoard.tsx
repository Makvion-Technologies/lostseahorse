"use client";

import { useState } from "react";
import { ShareBar } from "./ShareBar";
import { WpmChart } from "./WpmChart";
import {
  Icons,
  InlineStat,
  Medal,
  PosterSheet,
  ResultsPoster,
} from "@/components/results/ResultsPoster";
import {
  ogImageUrl,
  placeLabel,
  tweetIntentUrl,
  type SharePayload,
} from "@/lib/share";
import { cn } from "@/lib/cn";
import { placeTag } from "@/lib/placings";
import type { ChartMark, WpmSample } from "@/lib/runStats";
import type { ColorHex, GameMode, StyleId } from "@/lib/types";

export type BoardRow = {
  id: string;
  name: string;
  style: StyleId;
  color: ColorHex;
  wpm: number;
  accuracy: number;
  place: number;
  finished: boolean;
  you?: boolean;
  left?: boolean;
  tied?: boolean;
};

function Standings({ rows, tags }: { rows: BoardRow[]; tags: boolean }) {
  const you = rows.find((r) => r.you);
  const shown = rows.slice(0, 6);
  if (you && !shown.includes(you)) shown[shown.length - 1] = you;
  return (
    <ol
      aria-label="Standings"
      className="mx-auto flex max-w-full justify-center gap-1.5 overflow-hidden sm:gap-2"
    >
      {shown.map((row) => (
        <li
          key={row.id}
          title={`${row.name} · ${row.wpm} wpm · ${row.accuracy}% acc${row.finished ? "" : " · dnf"}`}
          className={cn(
            "flex min-w-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-transform hover:-translate-y-0.5 sm:gap-2 sm:px-3",
            row.you
              ? "border-[color-mix(in_oklab,var(--hero)_60%,transparent)] bg-[color-mix(in_oklab,var(--hero)_16%,transparent)] text-ink"
              : "border-line bg-card/50 text-muted",
          )}
        >
          {tags ? (
            <PlaceBadge place={row.place} total={rows.length} tied={row.tied} />
          ) : (
            <span className="font-mono tabular-nums">{row.place}</span>
          )}
          <span className="hidden max-w-[7rem] truncate md:inline">{row.name}</span>
          <span className="font-mono tabular-nums text-ink">{row.wpm}</span>
          {row.left ? (
            <span className="text-[0.6rem] uppercase">left</span>
          ) : !row.finished ? (
            <span className="text-[0.6rem] uppercase">dnf</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function PlaceBadge({ place, total, tied }: { place: number; total: number; tied?: boolean }) {
  const tag = placeTag(place, total, tied);
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-px font-mono text-[0.65rem] font-semibold uppercase tabular-nums",
        !tag.won
          ? "bg-[color-mix(in_oklab,var(--color-coral)_18%,transparent)] text-coral"
          : place === 1
            ? "bg-[color-mix(in_oklab,var(--color-teal)_24%,transparent)] text-teal"
            : "bg-card text-ink",
      )}
    >
      {tag.label}
    </span>
  );
}

export function ResultBoard({
  rows,
  mode,
  share,
  onAgain,
  onRepeat,
  settingsHref,
  samples = [],
  marks = [],
}: {
  samples?: WpmSample[];
  marks?: ChartMark[];
  rows: BoardRow[];
  mode: GameMode;
  share: SharePayload;
  onAgain: () => void;
  onRepeat?: () => void;
  /** Stranger races: swap Invite for a link back to the race settings. */
  settingsHref?: string;
}) {
  const you = rows.find((row) => row.you) ?? rows[0];
  const winner = rows[0];
  const [sheet, setSheet] = useState(false);

  const total = rows.length;
  const practice = mode === "practice";
  const youWon = !!you && !!winner && you.id === winner.id;
  const shareOnX = async () => {
    const intent = tweetIntentUrl(share);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "lost seahorse",
          text: `${share.wpm} WPM on lostseahorse.com`,
          url: ogImageUrl(share),
        });
        return;
      } catch {
        /* fall through to the intent */
      }
    }
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <ResultsPoster
        color={you?.color ?? "#2A9D8F"}
        badge={
          !practice && you ? <Medal place={you.place} total={total} /> : null
        }
        wpm={you?.wpm ?? 0}
        wpmHint="Words per minute"
        accuracy={you?.accuracy ?? 0}
        chart={<WpmChart samples={samples} marks={marks} />}
        stats={
          <>
            <InlineStat label="test" value={practice ? "practice" : mode} hint="Race type" />
            {!practice ? (
              <InlineStat
                label="place"
                value={
                  <>
                    {you?.place ?? "—"}
                    <span className="text-[0.6em] text-muted"> / {total}</span>
                  </>
                }
                hint={
                  mode === "stranger" && you
                    ? `${placeTag(you.place, total, you.tied).label} \u00B7 ${placeLabel(you.place)} of ${total} racers`
                    : `${placeLabel(you?.place ?? 0)} of ${total} racers`
                }
              />
            ) : null}
            {winner && !youWon ? (
              <InlineStat
                label="to 1st"
                value={`${Math.max(0, winner.wpm - (you?.wpm ?? 0))}`}
                hint={`${winner.name} finished first at ${winner.wpm} wpm`}
              />
            ) : null}
            <InlineStat
              label="field avg"
              value={Math.round(rows.reduce((s, r) => s + r.wpm, 0) / Math.max(1, total))}
              hint="Average WPM across everyone in this race"
            />
            <InlineStat
              label="racers"
              value={total}
              hint={`${rows.filter((r) => r.finished).length} finished`}
            />
          </>
        }
        strip={rows.length > 1 ? <Standings rows={rows} tags={mode === "stranger"} /> : undefined}
        primary={
          onRepeat
            ? { key: "repeat", label: "Repeat", onClick: onRepeat }
            : {
                key: "again",
                label: practice ? "New passage" : "Race again",
                onClick: onAgain,
              }
        }
        actions={[
          ...(onRepeat
            ? [
                {
                  key: "again",
                  label: practice ? "New passage" : "Race again",
                  icon: Icons.again,
                  onClick: onAgain,
                },
              ]
            : []),
          { key: "solo", label: "Practice", icon: Icons.solo, href: "/solo" },
          settingsHref
            ? { key: "settings", label: "Change settings", icon: Icons.invite, href: settingsHref }
            : { key: "invite", label: "Invite", icon: Icons.invite, href: "/friends" },
          {
            key: "x",
            label: "Share on X",
            icon: Icons.x,
            tone: "accent" as const,
            onClick: () => setSheet(true),
          },
        ]}
        overlay={
          sheet ? (
            <PosterSheet key="share" title="Share your result" onClose={() => setSheet(false)}>
              <ShareBar payload={share} />
              <button
                type="button"
                onClick={shareOnX}
                className="mt-3 text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Use device share sheet instead
              </button>
            </PosterSheet>
          ) : null
        }
      />
    </>
  );
}
