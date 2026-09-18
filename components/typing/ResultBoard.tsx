"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { RacerSeahorse } from "@/components/seahorse/RacerSeahorse";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShareBar } from "./ShareBar";
import { stripeLink } from "@/lib/env";
import { placeLabel, type SharePayload } from "@/lib/share";
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
};

function CountUp({ value, reduce }: { value: number; reduce: boolean | null }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);
  if (reduce) return <>{value}</>;
  return <>{shown}</>;
}

export function ResultBoard({
  rows,
  mode,
  plankton,
  share,
  onAgain,
  onRepeat,
}: {
  rows: BoardRow[];
  mode: GameMode;
  plankton: number;
  share: SharePayload;
  onAgain: () => void;
  onRepeat?: () => void;
}) {
  const reduce = useReducedMotion();
  const you = rows.find((row) => row.you) ?? rows[0];
  const donate = stripeLink();
  const winner = rows[0];

  return (
    <Card className="relative mx-auto w-full max-w-2xl overflow-hidden">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {mode === "practice" ? "solo" : placeLabel(you?.place ?? 0)}
          </p>
          <div className="flex flex-wrap items-end gap-10">
            <p className="font-display text-7xl italic leading-none">
              <CountUp value={you?.wpm ?? 0} reduce={reduce} />
              <span className="ml-2 text-2xl text-muted">wpm</span>
            </p>
            <p className="font-display text-7xl italic leading-none">
              <CountUp value={you?.accuracy ?? 0} reduce={reduce} />%
              <span className="ml-2 text-2xl text-muted">accuracy</span>
            </p>
          </div>
          <p className="mt-3 text-muted">+{plankton} plankton</p>
        </div>
        {winner ? (
          <RacerSeahorse className="h-28 w-28" />
        ) : null}
      </div>

      {rows.length > 1 ? (
        <ol className="mt-8 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between border-t border-line pt-2 text-sm"
            >
              <span className={row.you ? "text-ink" : "text-muted"}>
                {row.place}. {row.name}
              </span>
              <span className="font-mono">
                {row.wpm} · {row.accuracy}%
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {onRepeat ? (
          <Button onClick={onRepeat}>Repeat</Button>
        ) : null}
        <Button onClick={onAgain} variant={onRepeat ? "ghost" : "primary"}>
          {mode === "practice" ? "New passage" : "Race again"}
        </Button>
        <Button href="/solo" variant="ghost">
          Solo
        </Button>
        <Button href="/friends" variant="ghost">
          Invite friends
        </Button>
        <Button href={donate ?? "/shop"} variant="quiet" external={Boolean(donate)}>
          Donate
        </Button>
      </div>

      <div className="mt-8">
        <ShareBar payload={share} />
      </div>

      {!reduce
        ? Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className="finish-mote pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-teal"
              style={{
                left: `${20 + i * 8}%`,
                bottom: "12%",
                ["--x" as string]: `${(i % 2 === 0 ? -1 : 1) * (12 + i * 4)}px`,
              }}
            />
          ))
        : null}
    </Card>
  );
}
