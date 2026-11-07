"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { NameRoll, VsLine } from "@/components/stranger/NameRoll";
import { vsLabel } from "@/lib/vsLabel";
import { HOME_ACTIONS, HOME_BOTTOM, HOME_COL, HOME_PAGE, HOME_REST, HOME_TOP, HOME_SETTINGS, HomeHeading, NEUTRAL_BTN, T_BASE, NameLine, PillRow, PrimaryButton, StatLine } from "@/components/lobby/HomeParts";
import {
  InfoTip,
  NameField,
  migratedNick,
  useNameField,
} from "@/components/profile/NamePicker";
import { useMatchmaker } from "@/hooks/useMatchmaker";
import { useProfile } from "@/hooks/useProfile";
import { useSave } from "@/hooks/useSave";
import { type Profile } from "@/lib/profileName";
import {
  DEFAULT_STRANGER,
  loadStrangerPrefs,
  queueSettings,
  saveStrangerPrefs,
  type StrangerLength,
  type StrangerPrefs,
} from "@/lib/strangers";
import { DEFAULT_COLOR, DEFAULT_STYLE, LEVELS } from "@/lib/types";
import { SIZE_SEATS, type MatchSize } from "@/lib/party/events";

const LENGTHS: { value: StrangerLength; label: string; ariaLabel: string }[] = [
  { value: "15", label: "15", ariaLabel: "15 seconds" },
  { value: "30", label: "30", ariaLabel: "30 seconds" },
  { value: "60", label: "60", ariaLabel: "60 seconds" },
  { value: "120", label: "120", ariaLabel: "120 seconds" },
];
const LEVEL_OPTS = LEVELS.map((value) => ({ value, label: value }));
const SIZES: { value: MatchSize; label: string; ariaLabel: string }[] = (["1v1", "1v2", "1v3", "1v5"] as const).map((value) => ({
  value,
  label: value,
  ariaLabel: `${value}, ${SIZE_SEATS[value]} racers`,
}));

function Searching({
  prefs,
  myName,
  locked,
  onCancel,
}: {
  prefs: StrangerPrefs;
  count: number;
  myName: string;
  locked: string | null;
  onCancel: () => void;
}) {
  const reduce = useReducedMotion();
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setElapsed((Date.now() - startedAt) / 1000),
      250,
    );
    return () => window.clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, onCancel]);

  const seats = SIZE_SEATS[prefs.size];


  return (
    <div
      className="flex w-full max-w-2xl flex-col items-center text-center"
      role="status"
      aria-live="polite"
    >
      <p className="sr-only">
        {locked ? "Matched" : seats === 2 ? "Finding a racer\u2026" : "Finding racers\u2026"}
      </p>
      <div className="w-full rounded-2xl border border-line bg-card px-4 py-7 sm:px-8 sm:py-9">
        <VsLine me={myName}>
          <NameRoll locked={locked} />
        </VsLine>
      </div>
      <div className="mt-7 flex items-center gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-teal"
            animate={reduce || locked ? undefined : { opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <div className="mt-7 flex w-full flex-col items-center gap-3">
        <div className="w-full max-w-[11.25rem] rounded-xl border border-line bg-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Matching…</p>
          <p
            className="mt-1 font-mono text-3xl tabular-nums text-ink sm:text-4xl"
            aria-label={`Matching for ${Math.floor(elapsed)} seconds`}
          >
            {mmss(elapsed)}
          </p>
        </div>
        <p className="text-sm tabular-nums text-muted" aria-label="Estimated wait about 30 seconds">
          Est. Time: 0:30
        </p>
      </div>
      <Button
        variant="ghost"
        onClick={onCancel}
        aria-keyshortcuts="Escape"
        disabled={!!locked}
        className="mt-16 min-h-12 min-w-36 px-8 text-base sm:mt-24"
      >
        Cancel
      </Button>
    </div>
  );
}

function mmss(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Rename row buttons: same 12px radius as the navbar mode trigger; equal height via a 2px border on both. */
const RENAME_BTN =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border-2 px-5 text-sm tracking-wide outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss disabled:cursor-not-allowed motion-reduce:transition-none";

export function RenameInline({
  current,
  onClose,
}: {
  current: string;
  onClose: () => void;
}) {
  const field = useNameField({
    mode: "change",
    initial: current,
    onDone: onClose,
  });
  return (
    <div className="flex flex-col gap-3">
      <NameField
        field={field}
        label="New racer name"
        onEnter={() => void field.submit()}
        onCancel={onClose}
        collapseStatus
      />
      <div className="flex flex-wrap items-center justify-between gap-2 lg:flex-nowrap lg:max-[1799px]:[&_button]:px-4">
        <p className="text-xs text-muted lg:whitespace-nowrap lg:max-[1799px]:text-[11px]">
          Your best scores stay with you when you rename.
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={onClose} className={`${RENAME_BTN} border-line bg-card text-ink hover:border-[color-mix(in_oklab,var(--color-ink)_30%,var(--color-line))] hover:bg-[color-mix(in_oklab,var(--color-ink)_6%,var(--color-card))]`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void field.submit()}
            disabled={!field.good || field.saving}
            className={`${RENAME_BTN} border-transparent bg-ink text-abyss hover:opacity-90 disabled:opacity-40`}
          >
            {field.saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StrangerInner({ autoGo, from }: { autoGo: boolean; from: "leaderboard" | null }) {
  const router = useRouter();
  // Where this search started; kept after the URL is cleaned so Cancel can go back there.
  const [origin] = useState(from);
  const { save } = useSave();
  const profile = useProfile();
  const match = useMatchmaker(true);
  const [prefs, setPrefs] = useState<StrangerPrefs>(DEFAULT_STRANGER);
  const [loaded, setLoaded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  // Matches stay hidden until 12s of searching, so timing never looks scripted.
  const [searchAt, setSearchAt] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const autoDone = useRef(false);
  const findRef = useRef<HTMLButtonElement>(null);
  const me = profile.profile;
  const first = useNameField({ mode: "first", initial: migratedNick(save) });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage after mount
    setPrefs(loadStrangerPrefs());
    setLoaded(true);
  }, []);

  const change = (patch: Partial<StrangerPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveStrangerPrefs(next);
      return next;
    });
  };

  const startQueue = useCallback(
    (who: Profile) => {
      const { goal, time } = queueSettings(prefs);
      setSearchAt(Date.now());
      setRevealed(false);
      match.queue({
        pid: who.id,
        style: DEFAULT_STYLE,
        color: DEFAULT_COLOR,
        level: prefs.level,
        time,
        goal,
        size: prefs.size,
        wpm: save.wpm,
        firstVisit: save.wpm == null,
      });
    },
    [match, prefs, save.wpm],
  );

  // No name yet: claim it first, then search.
  const find = useCallback(async () => {
    if (me) return startQueue(me);
    const claimed = await first.submit();
    if (claimed) startQueue(claimed);
  }, [first, me, startQueue]);
  const canFind = !!me || (first.good && !first.saving);

  useEffect(() => {
    if (!autoGo || autoDone.current || !loaded || !me) return;
    autoDone.current = true;
    void find();
    router.replace("/stranger");
  }, [autoGo, find, loaded, me, router]);

  useEffect(() => {
    if (match.status !== "matched" || !match.code) return;
    const code = match.code;
    const wait = Math.max(0, searchAt + 12_000 - Date.now());
    const show = window.setTimeout(() => setRevealed(true), wait);
    // Hold on the locked name for a beat, then go.
    const go = window.setTimeout(() => router.push(`/r/${code}?stranger=1`), wait + 1100);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(go);
    };
  }, [match.code, match.status, router, searchAt]);

  const searching = match.status === "waiting" || match.status === "matched";

  // Enter anywhere on the idle screen starts a search (except inside controls).
  useEffect(() => {
    if (searching || renaming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.metaKey || e.ctrlKey || e.altKey)
        return;
      const el = e.target as HTMLElement | null;
      if (
        el?.closest(
          "input, textarea, select, button, a, [role=radio], [role=tab]",
        )
      )
        return;
      e.preventDefault();
      if (canFind) void find();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canFind, find, renaming, searching]);

  const stats = me?.stats;

  if (searching) {
    return (
      <section className="flex min-h-[calc(100dvh-12rem)] w-full items-center justify-center px-4">
        <Searching
          prefs={prefs}
          count={match.count}
          myName={me?.name ?? ""}
          locked={
            match.status === "matched" && revealed
              ? vsLabel(match.opponents, 1) || "a stranger"
              : null
          }
          onCancel={() => {
            match.cancel();
            if (origin === "leaderboard") {
              router.push("/stranger/leaderboard");
              return;
            }
            requestAnimationFrame(() => findRef.current?.focus());
          }}
        />
      </section>
    );
  }

  const statLine =
    stats && stats.races > 0
      ? [
          ["Races", String(stats.races)],
          ["Best", `${stats.bestWpm} wpm`],
          ["Last", `${stats.lastWpm} wpm`],
        ]
      : null;

  return (
    <div className={HOME_PAGE}>
      <div className={HOME_TOP}>
        <HomeHeading title="Strangers" line="Race someone new. Same words, same start." />
      </div>
      <div className={HOME_REST}>
    <div className={`${HOME_COL} my-auto`}>

      {!me ? (
        <NameField field={first} label="Racer name" onEnter={() => void find()} />
      ) : renaming ? (
        <RenameInline current={me.name} onClose={() => setRenaming(false)} />
      ) : null}

      <div className={HOME_SETTINGS}>
        <PillRow id="len" label="Length" value={prefs.length} options={LENGTHS} onChange={(length) => change({ length })} />
        <PillRow
          id="lvl"
          label={
            <span className="flex items-center gap-0.5">
              Level
              <InfoTip id="lvl-tip" label="About levels">
                <span className="flex flex-col gap-1 text-left">
                  <span><b>Easy</b>: short, common words.</span>
                  <span><b>Medium</b>: about half common words, half longer everyday ones.</span>
                  <span><b>Hard</b>: mostly long words like &ldquo;environment&rdquo;, mixed with medium ones.</span>
                  <span className="text-muted">Lowercase, no punctuation or numbers.</span>
                </span>
              </InfoTip>
            </span>
          }
          value={prefs.level}
          options={LEVEL_OPTS}
          onChange={(level) => change({ level })}
        />
        <PillRow id="size" label="Racers" value={prefs.size} options={SIZES} onChange={(size) => change({ size })} />
      </div>

      <div className={HOME_ACTIONS}>
        <PrimaryButton
          buttonRef={findRef}
          autoFocus={!!me}
          disabled={!canFind}
          onClick={() => void find()}
          label={first.saving ? "Saving name…" : match.status === "replaced" ? "Search here instead" : "Find match"}
          above={
            match.status === "error" ? (
              <p role="alert" className={`${T_BASE} text-coral`}>{match.error}</p>
            ) : match.status === "replaced" ? (
              <p role="status" className={`${T_BASE} text-muted`}>You started searching in another tab.</p>
            ) : null
          }
          hint={me || canFind ? null : "Pick a name to start."}
        />
        {me && !renaming ? <NameLine name={me.name} canRename onRename={() => setRenaming(true)} /> : null}
      </div>
    </div>
      </div>
      <div className={HOME_BOTTOM}>
        {statLine ? <StatLine rows={statLine} /> : null}
        <Link href="/stranger/leaderboard" className={NEUTRAL_BTN}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" className="block size-[calc(var(--u)*1.05)] shrink-0" style={{ color: "var(--teal)" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
          </svg>
          Leaderboard
        </Link>
      </div>
    </div>
  );
}

export function StrangerScreen({
  autoGo = false,
  from = null,
}: {
  autoGo?: boolean;
  from?: "leaderboard" | null;
}) {
  const profile = useProfile();
  const { ready } = useSave();
  if (profile.status === "loading" || !ready) {
    return <p className="text-center text-muted">Drifting in…</p>;
  }
  return <StrangerInner autoGo={autoGo} from={from} />;
}
