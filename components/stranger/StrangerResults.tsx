"use client";

import type React from "react";
import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SoloResults } from "@/components/typing/SoloResults";
import type { PosterAction } from "@/components/results/ResultsPoster";
import type { ResultRow, RoomSettings } from "@/lib/party/events";
import { racerStats } from "@/lib/racerStats";
import type { RunStats } from "@/lib/runStats";
import { placeTheme, podiumSize } from "@/lib/placings";

type Row = ResultRow & { you: boolean };

const EASE = [0.22, 1, 0.36, 1] as const;

/** Front-face height per tier: 1st tallest, 2nd, 3rd; 0 = the low empty step. */
const STEP: Record<number, string> = {
  1: "h-[clamp(7rem,22vw,10.5rem)]",
  2: "h-[clamp(5rem,15vw,7.5rem)]",
  3: "h-[clamp(3.75rem,11vw,5.75rem)]",
  0: "h-[clamp(1.75rem,5vw,2.5rem)]",
};

const SUFFIX: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };

/** Solid tones per tier (no gradients): ledge = lit top face, side = shaded edge. */
const TONE = {
  first: {
    face: "bg-teal text-abyss",
    ledge: "bg-[color-mix(in_srgb,var(--teal)_72%,white)]",
    side: "bg-[color-mix(in_srgb,var(--teal)_70%,black)]",
  },
  empty: {
    face: "bg-[color-mix(in_srgb,var(--ink)_9%,var(--card))]",
    ledge: "bg-[color-mix(in_srgb,var(--ink)_22%,var(--card))]",
    side: "bg-[color-mix(in_srgb,var(--ink)_4%,var(--card))]",
  },
} as const;

function Crown() {
  return (
    <svg viewBox="0 0 24 16" aria-hidden className="h-4 w-6 text-teal sm:h-5 sm:w-7" fill="currentColor">
      <path d="M2 14h20v2H2zM2 12 1 3l6 4.5L12 0l5 7.5L23 3l-1 9z" />
    </svg>
  );
}

function Step({ tier, children }: { tier: number; children?: React.ReactNode }) {
  // Placed steps are re-themed by their wrapper, so they all use the lit tone.
  const tone = tier === 0 ? TONE.empty : TONE.first;
  return (
    <div className="relative w-full">
      {/* lit top ledge */}
      <div className={"h-2 w-full rounded-t-md sm:h-2.5 " + tone.ledge} />
      <div className={"relative flex w-full items-start justify-center overflow-hidden pt-[clamp(0.5rem,2vw,1rem)] " + STEP[tier] + " " + tone.face}>
        {children}
        {/* shaded side edge for depth */}
        <div aria-hidden className={"absolute inset-y-0 right-0 w-1.5 sm:w-2 " + tone.side} />
      </div>
    </div>
  );
}

/** One podium step; a genuine tie stands its racers side by side on it. */
function PodiumSpot({ rows, delay, total }: { rows: Row[]; delay: number; total: number }) {
  const reduce = useReducedMotion();
  const place = rows[0]!.place;
  const first = place === 1;
  const tied = rows.length > 1;
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : delay }}
      className={"flex w-full min-w-0 flex-col items-center " + placeTheme(rows[0]!, total)}
      // Grid column shares one width across all steps; a tie spans one column per racer.
      style={{ gridColumn: `span ${rows.length}`, maxWidth: `calc(${rows.length} * min(12rem, 31vw))` }}
    >
      <div className="mb-2 flex min-h-5 items-end">{first ? <Crown /> : null}</div>
      <div className="flex w-full min-w-0 justify-center gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex min-w-0 flex-auto flex-col items-center">
            <span
              className={
                "flex min-w-0 max-w-full flex-col items-center px-1 text-center font-display italic leading-tight [overflow-wrap:break-word] " +
                (first && !tied
                  ? "text-[clamp(0.7rem,0.35rem+1.15vw,1.4rem)]"
                  : "text-[clamp(0.6rem,0.38rem+0.72vw,1.1rem)]") +
                (row.you ? " text-teal" : " text-ink")
              }
            >
              <span className="block w-full min-w-0">{row.name}</span>
              {row.you ? (
                <span className="mt-0.5 block whitespace-nowrap text-[0.72em] not-italic text-teal opacity-80">(You)</span>
              ) : null}
            </span>
            <span className="mb-2.5 mt-0.5 text-xs tabular-nums text-[var(--wpm)] sm:text-sm">
              {Math.round(row.wpm)} wpm
            </span>
          </div>
        ))}
      </div>
      <Step tier={place}>
        <span className="flex flex-col items-center">
          <span className="flex items-start font-display italic leading-none">
            <span className={first ? "text-[clamp(2.75rem,9vw,4.5rem)]" : "text-[clamp(2rem,6.5vw,3.25rem)]"}>
              {place}
            </span>
            <span className="mt-1 text-[clamp(0.7rem,0.6rem+0.4vw,0.95rem)] not-italic tracking-wide opacity-80">
              {SUFFIX[place]}
            </span>
          </span>
          {tied ? (
            <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.25em] opacity-80 sm:text-xs">
              Tied
            </span>
          ) : null}
        </span>
      </Step>
    </motion.li>
  );
}

/** Low unoccupied step so a 1v1 podium never stands as a lone box. */
function EmptyStep({ delay }: { delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      aria-hidden
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : delay }}
      className="flex w-full min-w-0 flex-col items-center"
    >
      <Step tier={0} />
    </motion.li>
  );
}

function Podium({ rows }: { rows: Row[] }) {
  const reduce = useReducedMotion();
  const size = podiumSize(rows.length);
  const ranked = [...rows].sort((a, b) => a.place - b.place);
  const winners = ranked.filter(
    (row) => !row.flagged && !row.left && row.place >= 1 && row.place <= size,
  );
  const losers = ranked.filter((row) => !winners.includes(row));
  // Classic order: 2nd left, 1st centre, 3rd right.
  // Tied racers share a place, so group them onto one step.
  const order = [2, 1, 3]
    .map((place) => winners.filter((row) => row.place === place))
    .filter((group) => group.length > 0);
  const lone = order.length === 1;

  return (
    <section aria-label="Podium" className="mx-auto flex w-full max-w-[72rem] flex-col items-center gap-7">
      <div className="flex w-full flex-col items-center">
        <ol
          className="grid w-max max-w-full items-end"
          // Equal 1fr tracks: every step takes the widest name's width, within a cap.
          style={{
            gridTemplateColumns: `repeat(${lone ? 3 : order.reduce((n, g) => n + g.length, 0)}, minmax(min(7rem, 26vw), 1fr))`,
          }}
        >
          {lone ? <EmptyStep delay={0.05} /> : null}
          {order.map((group) => (
            <PodiumSpot
              key={group[0]!.id}
              rows={group}
              total={rows.length}
              delay={group[0]!.place === 1 ? 0.25 : group[0]!.place === 2 ? 0.1 : 0.4}
            />
          ))}
          {lone ? <EmptyStep delay={0.4} /> : null}
        </ol>
        {/* floor line under every step */}
        <div aria-hidden className="h-1 w-[min(100%,calc(100%+2rem))] rounded-full bg-line" />
      </div>
      {losers.length ? (
        <motion.ul
          aria-label="Lost"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.65 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {losers.map((row) => (
            <li
              key={row.id}
              className={
                "place-theme-lost flex min-w-0 max-w-full flex-wrap items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs sm:text-sm " +
                (row.you ? "border-teal" : "border-teal/45")
              }
            >
              <span className="min-w-0 font-display italic text-teal [overflow-wrap:anywhere]">
                {row.you ? "You" : row.name}
              </span>
              <span className="shrink-0 text-teal">{row.left ? "left" : row.tied ? "tied" : "lost"}</span>
            </li>
          ))}
        </motion.ul>
      ) : null}
    </section>
  );
}

function Comparison({
  rows,
  selected,
  onSelect,
}: {
  rows: Row[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  // You first, then everyone else by place.
  const sorted = [
    ...rows.filter((row) => row.you),
    ...rows.filter((row) => !row.you).sort((a, b) => a.place - b.place),
  ];
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const i = sorted.findIndex((row) => row.id === selected);
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (i + 1) % sorted.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (i - 1 + sorted.length) % sorted.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = sorted.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const id = sorted[next]!.id;
    onSelect(id);
    refs.current.get(id)?.focus({ preventScroll: true });
  };
  return (
    <section aria-label="Comparison">
      <div
        role="tablist"
        aria-label="Racer results"
        onKeyDown={onKeyDown}
        className="flex flex-wrap justify-center gap-3"
      >
        {sorted.map((row) => {
          const on = row.id === selected;
          return (
            <button
              key={row.id}
              ref={(el) => {
                if (el) refs.current.set(row.id, el);
                else refs.current.delete(row.id);
              }}
              type="button"
              role="tab"
              id={`racer-tab-${row.id}`}
              aria-selected={on}
              aria-controls="racer-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => onSelect(row.id)}
              className={
                "flex min-w-[8.5rem] flex-auto basis-[8.5rem] cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-3 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-teal motion-reduce:transition-none sm:max-w-[17rem] " +
                placeTheme(row, rows.length) +
                (on
                  ? " border-teal bg-teal text-abyss"
                  : " border-[color-mix(in_srgb,var(--teal)_75%,var(--card))] bg-[color-mix(in_srgb,var(--teal)_16%,var(--card))] hover:border-teal hover:bg-[color-mix(in_srgb,var(--teal)_26%,var(--card))]")
              }
            >
              <span
                className={"text-xs font-semibold uppercase [overflow-wrap:break-word] " + (on ? "text-abyss " : "text-teal ") +
                  (row.name.length > 10 && !row.you ? "text-[0.68rem] tracking-[0.04em] " : "tracking-[0.2em] ") +
                  ""}
                >
                {row.you ? "You" : row.name}
              </span>
              <span className="flex items-baseline gap-4 tabular-nums">
                <span>
                  <span className={"font-display text-2xl italic " + (on ? "text-abyss" : "text-[var(--wpm)]")}>{Math.round(row.wpm)}</span>
                  <span className={"ml-1 text-xs " + (on ? "text-abyss/75" : "text-muted")}>wpm</span>
                </span>
                <span>
                  <span className={"font-display text-xl italic " + (on ? "text-abyss" : "text-ink")}>{Math.round(row.accuracy)}%</span>
                  <span className={"ml-1 text-xs " + (on ? "text-abyss/75" : "text-muted")}>acc</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Strangers results: podium, then everyone's WPM/accuracy in one row, then the
 * exact Solo results for your own run. Scrolls with the page.
 */
export function StrangerResults({
  rows,
  stats,
  passage,
  settings,
  onNew,
  onLobby,
  newLabel = "New match",
  lobbyLabel = "Lobby",
  leaderboard = true,
}: {
  rows: Row[];
  /** Null when your own run couldn't be rebuilt. */
  stats: RunStats | null;
  passage: string;
  settings: RoomSettings;
  onNew: () => void;
  onLobby: () => void;
  newLabel?: string;
  lobbyLabel?: string;
  /** Friends races aren't ranked, so they hide the Leaderboard link. */
  leaderboard?: boolean;
}) {
  const reduce = useReducedMotion();
  const lobby: PosterAction = { key: "lobby", label: lobbyLabel, onClick: onLobby };
  const board: PosterAction = {
    key: "leaderboard",
    label: "Leaderboard",
    href: "/stranger/leaderboard",
  };
  const youId = rows.find((row) => row.you)?.id ?? "";
  const [selected, setSelected] = useState(youId);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Open at the very top (podium), not wherever the race left the scroll.
  // Late layout (charts, motion, focus leaving the race field) can still
  // shift the page, so hold the top for a few frames until the user acts.
  useLayoutEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const active = document.activeElement;
    if (active instanceof HTMLElement && !rootRef.current?.contains(active)) active.blur();
    const toTop = () => {
      for (let el = rootRef.current?.parentElement; el; el = el.parentElement) {
        if (el.scrollTop) el.scrollTop = 0;
      }
      if (window.scrollY || document.documentElement.scrollTop) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };
    toTop();
    let raf = 0;
    let frames = 0;
    let stopped = false;
    const until = performance.now() + 600;
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
    const tick = () => {
      if (stopped) return;
      toTop();
      frames += 1;
      if (frames < 3 || performance.now() < until) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const opts = { passive: true, capture: true } as const;
    window.addEventListener("wheel", stop, opts);
    window.addEventListener("touchstart", stop, opts);
    window.addEventListener("keydown", stop, opts);
    window.addEventListener("pointerdown", stop, opts);
    return () => {
      stop();
      window.removeEventListener("wheel", stop, opts);
      window.removeEventListener("touchstart", stop, opts);
      window.removeEventListener("keydown", stop, opts);
      window.removeEventListener("pointerdown", stop, opts);
    };
  }, []);

  // Only an explicit pick of a racer card scrolls; the default selection never does.
  const select = (id: string) => {
    if (id === selected) return;
    setSelected(id);
    panelRef.current?.scrollIntoView({
      block: "center",
      behavior: reduce ? "instant" : "smooth",
    });
  };
  // Everyone else's run, rebuilt from the server's keystroke log.
  const others = useMemo(() => {
    const map = new Map<string, RunStats | null>();
    for (const row of rows) if (!row.you) map.set(row.id, racerStats(row, passage, settings));
    return map;
  }, [rows, passage, settings]);
  const shown = selected === youId ? stats : (others.get(selected) ?? null);
  const who = rows.find((row) => row.id === selected);
  return (
    <div ref={rootRef} className="mx-auto flex w-full max-w-[90rem] flex-col gap-10 pt-4 sm:gap-14 sm:pt-8">
      <h1 className="sr-only">Race results</h1>
      <Podium rows={rows} />
      <Comparison rows={rows} selected={selected} onSelect={select} />
      <div ref={panelRef} id="racer-panel" role="tabpanel" aria-labelledby={`racer-tab-${selected}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
            className={who ? placeTheme(who, rows.length) : undefined}
          >
            {shown ? (
              <SoloResults inline stats={shown} onNew={onNew} newLabel={newLabel} extraActions={leaderboard ? [lobby, board] : [lobby]} />
            ) : (
              <p className="py-16 text-center text-muted">
                Detailed results for {who?.name ?? "this racer"} aren&apos;t available.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
