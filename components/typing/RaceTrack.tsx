"use client";

import { RacerSeahorse } from "@/components/seahorse/RacerSeahorse";
import type { ColorHex, StyleId } from "@/lib/types";
import { cn } from "@/lib/cn";

export type LaneRacer = {
  id: string;
  name: string;
  style: StyleId;
  color: ColorHex;
  progress: number;
  you?: boolean;
};

export function RaceTrack({ racers }: { racers: LaneRacer[] }) {
  return (
    <div className="space-y-3">
      {racers.map((racer) => (
        <div key={racer.id} className="relative h-12">
          <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
          <div
            className="absolute top-0 will-change-transform"
            style={{
              transform: `translate3d(calc(${Math.min(1, Math.max(0, racer.progress))} * (100% - 2.5rem)), 0, 0)`,
            }}
          >
            <RacerSeahorse alt={racer.name || "seahorse"} className="h-12 w-12" />
          </div>
          {racer.name ? (
            <span
              className={cn(
                "absolute right-0 top-0 text-xs",
                racer.you ? "text-ink" : "text-muted",
              )}
            >
              {racer.name}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
