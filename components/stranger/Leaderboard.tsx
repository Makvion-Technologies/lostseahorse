"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useProfile } from "@/hooks/useProfile";
import { fetchLeaderboard } from "@/lib/profile";
import { type LeaderRow, type LeaderboardResponse } from "@/lib/leaderboard";

const TOP_THEME: Record<number, string> = { 1: "place-theme-1", 2: "place-theme-2", 3: "place-theme-3" };

/** +n up, -n down, dash for no change, "new" for a first entry today. */
function Move({ move }: { move: number | null }) {
  if (move === null) {
    return <span className="text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[var(--place-1)]">new</span>;
  }
  if (move === 0) return <span className="text-muted" aria-label="No change">–</span>;
  const up = move > 0;
  return (
    <span
      aria-label={up ? `Up ${move}` : `Down ${-move}`}
      className={
        "font-semibold " +
        (up ? "text-[var(--place-1)]" : "text-[var(--place-lost)]")
      }
    >
      {up ? "+" : "−"}
      {Math.abs(move)}
    </span>
  );
}

function Row({ row, you, delay }: { row: LeaderRow; you: boolean; delay: number }) {
  const reduce = useReducedMotion();
  const top = TOP_THEME[row.rank];
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : delay }}
      className={
        "grid grid-cols-[2.25rem_minmax(0,1fr)_auto_3rem] items-center gap-x-3 rounded-2xl border px-3 py-2.5 sm:grid-cols-[3rem_minmax(0,1fr)_auto_auto_4rem] sm:gap-x-5 sm:px-5 sm:py-3 " +
        "[@media(min-width:40rem)_and_(min-height:37.5rem)]:h-[var(--r)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:grid-cols-[var(--lb-cols)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:gap-x-[calc(var(--r)*0.4)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:rounded-[calc(var(--r)*0.26)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:px-[calc(var(--r)*0.5)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:py-0 " +
        (top
          ? top + " border-[color-mix(in_srgb,var(--teal)_75%,var(--card))] bg-[color-mix(in_srgb,var(--teal)_16%,var(--card))]"
          : you
            ? "border-[color-mix(in_srgb,var(--ink)_40%,var(--card))] bg-[color-mix(in_srgb,var(--ink)_7%,var(--card))]"
            : "border-line bg-card")
      }
    >
      <span
        className={
          "font-mono text-lg tabular-nums sm:text-xl [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[calc(var(--r)*0.4)] " + (top ? "text-teal" : "text-muted")
        }
      >
        {row.rank}
      </span>
      <span className="min-w-0 text-sm font-medium leading-tight [overflow-wrap:anywhere] sm:text-base [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[calc(var(--r)*0.34)]">
        <span className={top ? "text-teal" : "text-ink"}>{row.name}</span>
        {you ? <span className="ml-1.5 whitespace-nowrap text-xs font-normal text-muted [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[max(0.75rem,calc(var(--r)*0.24))]">(You)</span> : null}
      </span>
      <span className="whitespace-nowrap tabular-nums">
        <span className={"font-mono text-lg sm:text-xl [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[calc(var(--r)*0.4)] " + (top ? "text-[var(--wpm)]" : "text-ink")}>{row.wpm}</span>
        <span className="ml-1 text-xs text-muted [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[max(0.75rem,calc(var(--r)*0.24))]">wpm</span>
      </span>
      <span className="hidden whitespace-nowrap tabular-nums sm:inline">
        <span className="font-mono text-base text-ink [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[calc(var(--r)*0.32)]">{Math.round(row.acc)}%</span>
        <span className="ml-1 text-xs text-muted [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[max(0.75rem,calc(var(--r)*0.24))]">acc</span>
      </span>
      <span className="text-right text-sm tabular-nums sm:text-base [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[max(0.875rem,calc(var(--r)*0.3))]">
        <Move move={row.move} />
      </span>
    </motion.li>
  );
}

/** Back to the Strangers lobby, or straight into matching with your saved settings. */
function BoardActions() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 [@media(min-width:40rem)_and_(min-height:37.5rem)]:gap-[max(0.75rem,calc(var(--r)*0.3))]">
      <Link
        href="/stranger"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-line bg-card px-4 py-2 text-sm font-medium text-ink outline-none transition-colors hover:border-[color-mix(in_oklab,var(--color-ink)_30%,var(--color-line))] hover:bg-[color-mix(in_oklab,var(--color-ink)_6%,var(--color-card))] focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss motion-reduce:transition-none sm:text-base [@media(min-width:40rem)_and_(min-height:37.5rem)]:min-h-[max(2.75rem,calc(var(--r)*0.95))] [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[max(0.875rem,calc(var(--r)*0.3))] [@media(min-width:40rem)_and_(min-height:37.5rem)]:px-[max(1rem,calc(var(--r)*0.55))]"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-4 text-muted [@media(min-width:40rem)_and_(min-height:37.5rem)]:size-[max(1rem,calc(var(--r)*0.32))]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Back to home
      </Link>
      <Link
        href="/stranger?go=1&from=leaderboard"
        className="inline-flex min-h-11 items-center rounded-xl bg-teal px-8 font-medium text-abyss outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss [@media(min-width:40rem)_and_(min-height:37.5rem)]:min-h-[max(2.75rem,calc(var(--r)*0.95))] [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[max(0.875rem,calc(var(--r)*0.3))] [@media(min-width:40rem)_and_(min-height:37.5rem)]:px-[max(2rem,calc(var(--r)*1.1))]"
      >
        Find match
      </Link>
    </div>
  );
}

function EmptyBoard() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink/20 px-5 py-12 text-center">
      <p className="text-xl font-semibold text-ink">No one on the board yet</p>
      <p className="max-w-sm text-sm text-muted">
        Finish any timed Strangers race and your best speed lands here first.
      </p>
      <div className="mt-2">
        <BoardActions />
      </div>
    </section>
  );
}

/** The board itself; data comes in so previews can render it without a server. */
export function LeaderboardView({
  data,
  youId,
  status,
}: {
  data: LeaderboardResponse | null;
  youId: string | null;
  status: "loading" | "ready" | "error";
}) {
  const empty = status === "ready" && (!data || data.rows.length === 0);
  // Top 10 only; if you're further down, your row is pinned underneath.
  const top = data?.rows.slice(0, 10) ?? [];
  const pinned = data ? (data.you ?? data.rows.slice(10).find((row) => row.id === youId) ?? null) : null;
  return (
    <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6 px-1 py-4 [--r:clamp(2rem,min(calc((100dvh-14rem)/16.9),5.4vw),5rem)] [--lb-cols:calc(var(--r)*1.1)_minmax(0,1fr)_calc(var(--r)*2.7)_calc(var(--r)*2.2)_calc(var(--r)*1.7)] sm:gap-8 sm:py-8 2xl:max-w-4xl [@media(min-width:40rem)_and_(min-height:37.5rem)]:w-[min(100%,max(60vw,calc(var(--r)*14)),80rem)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:max-w-none [@media(min-width:40rem)_and_(min-height:37.5rem)]:gap-[calc(var(--r)*0.4)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:py-0">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-display font-normal italic tracking-tight text-ink sm:text-3xl [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[clamp(1.5rem,calc(var(--r)*0.62),2.5rem)]">Leaderboard</h1>
      </header>
      {status === "error" ? (
        <p role="alert" className="py-10 text-center text-coral">Couldn&apos;t load the leaderboard. Try again soon.</p>
      ) : status === "loading" && !data ? (
        <p className="py-10 text-center text-muted">Loading…</p>
      ) : !data || data.rows.length === 0 ? (
        <EmptyBoard />
      ) : (
        <section aria-label="Strangers leaderboard" className="flex flex-col gap-2 [@media(min-width:40rem)_and_(min-height:37.5rem)]:gap-[calc(var(--r)*0.14)]">
          <div
            aria-hidden
            className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto_3rem] gap-x-3 px-3 text-[11px] uppercase tracking-[0.18em] text-muted sm:grid-cols-[3rem_minmax(0,1fr)_auto_auto_4rem] sm:gap-x-5 sm:px-5 [@media(min-width:40rem)_and_(min-height:37.5rem)]:grid-cols-[var(--lb-cols)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:gap-x-[calc(var(--r)*0.4)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:px-[calc(var(--r)*0.5)] [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[max(11px,calc(var(--r)*0.2))]"
          >
            <span>#</span>
            <span>Racer</span>
            <span>Speed</span>
            <span className="hidden sm:inline">Acc</span>
            <span className="text-right">Move</span>
          </div>
          <ol className="flex flex-col gap-2 [@media(min-width:40rem)_and_(min-height:37.5rem)]:gap-[calc(var(--r)*0.14)]">
            {top.map((row, i) => (
              <Row key={row.id} row={row} you={row.id === youId} delay={Math.min(i, 12) * 0.03} />
            ))}
          </ol>
          {pinned ? (
            <>
              <p aria-hidden className="text-center leading-none text-muted">⋯</p>
              <ol start={pinned.rank}>
                <Row row={pinned} you delay={0} />
              </ol>
            </>
          ) : null}
          <p className="pt-1 text-center text-xs text-muted [@media(min-width:40rem)_and_(min-height:37.5rem)]:text-[max(0.75rem,calc(var(--r)*0.24))] [@media(min-width:40rem)_and_(max-height:53rem)]:hidden">
            {data.total} {data.total === 1 ? "racer" : "racers"} on this board
          </p>
        </section>
      )}
      {empty ? null : (
      <BoardActions />
      )}
    </div>
  );
}

export function StrangerLeaderboard() {
  const profile = useProfile();
  const youId = profile.id || null;
  const key = youId ?? "";
  const [loaded, setLoaded] = useState<{ key: string; data: LeaderboardResponse | null; error: boolean } | null>(
    null,
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchLeaderboard(key, ctrl.signal)
      .then((data) => setLoaded({ key, data, error: false }))
      .catch(() => {
        if (!ctrl.signal.aborted) setLoaded({ key, data: null, error: true });
      });
    return () => ctrl.abort();
  }, [key]);

  const fresh = loaded?.key === key;
  const status = fresh ? (loaded.error ? "error" : "ready") : "loading";
  // Keep the last board on screen while the next one loads.
  const data = loaded?.data ?? null;

  return (
    <LeaderboardView
      data={data}
      youId={youId}
      status={status}
    />
  );
}
