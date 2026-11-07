"use client";

import type { PlayerPublic } from "@/lib/party/events";
import { cn } from "@/lib/cn";

/** Live race progress: one solid bar per racer. */
export function RaceLanes({ players, youId }: { players: PlayerPublic[]; youId?: string }) {
  const sorted = [...players].sort((a, b) => Number(b.id === youId) - Number(a.id === youId));
  return (
    <ol aria-label="Racers" className="flex flex-col gap-1.5">
      {sorted.map((p) => {
        const you = p.id === youId;
        const pct = Math.round(Math.max(0, Math.min(1, p.progress)) * 100);
        const tag = !p.connected && !p.finished ? "left" : p.finished ? "done" : null;
        return (
          <li key={p.id} className="flex items-center gap-2 text-xs sm:gap-3">
            <span className={cn("w-20 shrink-0 truncate sm:w-28", you ? "text-ink" : "text-muted", !p.connected && "line-through")}>
              {you ? "You" : p.name}
            </span>
            <span
              className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label={`${you ? "You" : p.name}${tag ? `, ${tag}` : ""}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <span
                className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-200", you ? "bg-teal" : p.connected ? "bg-muted" : "bg-line")}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="w-9 shrink-0 text-right font-mono text-[0.65rem] uppercase text-muted">
              {tag === "left" || tag === "done" ? tag : `${pct}%`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
