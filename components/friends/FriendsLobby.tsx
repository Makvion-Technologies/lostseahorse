"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Toast } from "@/components/ui/Toast";
import { siteUrl } from "@/lib/env";
import { FRIENDS_MAX, FRIENDS_MIN, type RoomState } from "@/lib/party/events";
import { sizeName } from "@/lib/friends";
import { HOME_BOTTOM, HOME_COL_DENSE, HOME_PAGE, HOME_REST, HOME_TOP, NEUTRAL_BTN, PrimaryButton, T_SMALL } from "@/components/lobby/HomeParts";

const RING = "outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";
const LEAVE = "#c4605a";

function Icon({ d, className = "size-4" }: { d: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const I = {
  copy: "M9 9h10v10H9zM5 15V5h10",
  check: "M5 12.5l4.5 4.5L19 7",
  share: "M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5",
  exit: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4",
};

function Dots() {
  return (
    <span aria-hidden className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-teal motion-reduce:animate-none"
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </span>
  );
}

/** Friends room lobby: one centred flow. Invite, see who's in, start. */
export function FriendsLobby({
  state,
  youId,
  onStart,
}: {
  state: RoomState;
  youId: string | undefined;
  onStart: () => void;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const link = `${siteUrl()}/r/${state.code}`;
  const pretty = link.replace(/^https?:\/\//, "");
  const max = Math.max(FRIENDS_MIN, Math.min(FRIENDS_MAX, state.maxPlayers ?? FRIENDS_MAX));
  const here = state.players.filter((p) => p.connected);
  const host = here.find((p) => p.id === state.hostId);
  const slots = Array.from({ length: max }, (_, i) => here[i] ?? null);
  const isHost = state.youAreHost;
  const canStart = here.length >= FRIENDS_MIN;
  const full = here.length >= max;
  const s = state.settings;
  const chips = [s.goal === "words" ? `${s.time} words` : `${s.time}s`, s.level, sizeName(max)];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature check after mount
    setCanShare(typeof navigator.share === "function");
  }, []);

  // Tab title shows the head count.
  useEffect(() => {
    const prev = document.title;
    document.title = `(${here.length}/${max}) Room ${state.code} · lost seahorse`;
    return () => {
      document.title = prev;
    };
  }, [here.length, max, state.code]);

  // "X joined" / "X left" toasts (skip the first snapshot).
  const seen = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    const now = new Map(here.map((p) => [p.id, p.name]));
    const before = seen.current;
    seen.current = now;
    if (!before) return;
    const joined = [...now].find(([id]) => !before.has(id) && id !== youId);
    const left = [...before].find(([id]) => !now.has(id));
    if (joined) setToast(`${joined[1]} joined`);
    else if (left) setToast(`${left[1]} left`);
  }, [here, youId]);

  const copy = useCallback(
    async (what: "link" | "code") => {
      try {
        await navigator.clipboard.writeText(what === "link" ? link : state.code);
        setCopied(what);
        setCopiedToast(null);
        window.requestAnimationFrame(() => setCopiedToast("Copied"));
        window.setTimeout(() => setCopied((c) => (c === what ? null : c)), 1800);
      } catch {
        setToast("Couldn't copy. Select the link instead.");
      }
    },
    [link, state.code],
  );
  const share = async () => {
    if (!canShare) {
      void copy("link");
      return;
    }
    try {
      await navigator.share({ title: "Race me on lost seahorse", text: `Join my typing race · room ${state.code}`, url: link });
    } catch {
      /* dismissed */
    }
  };

  // Enter starts for the host.
  useEffect(() => {
    if (!isHost || !canStart) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "Enter" || e.repeat || t?.closest("button,a,input,textarea,[contenteditable]")) return;
      e.preventDefault();
      onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHost, canStart, onStart]);

  const leave = () => {
    if (isHost && here.length > 1 && !confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    router.push("/friends");
  };
  const nextHost = here.find((p) => p.id !== youId)?.name;

  // Every control sizes off --u (set by the home column), like the Friends and
  // Strangers homes: fields u*2.85, primary u*2.8, secondary u*2.5.
  const row = "flex h-[var(--seat)] min-w-0 items-center gap-2 rounded-xl px-[calc(var(--u)*0.85)] text-[length:calc(var(--u)*0.92)]";
  const FIELD = "flex h-[calc(var(--u)*2.85)] min-w-0 shrink-0 items-center gap-2 rounded-xl bg-foam pl-[calc(var(--u)*0.85)] pr-[calc(var(--u)*0.3)] ring-1 ring-line";
  const ICON_BTN = `relative inline-flex size-[calc(var(--u)*2.15)] shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-card hover:text-ink motion-reduce:transition-none ${RING}`;
  const ico = "size-[calc(var(--u)*1.05)]";
  const copyIcon = (what: "link" | "code") =>
    copied === what ? <Icon d={I.check} className={`${ico} text-teal`} /> : <Icon d={I.copy} className={ico} />;
  return (
    <div className={`${HOME_PAGE} max-h-[calc(100dvh-10rem)] sm:max-h-[calc(100dvh-12rem)]`}>
      <header className={`${HOME_TOP} shrink-0 text-center`}>
        <h1 className="truncate font-display text-[length:calc(var(--u)*2.4)] leading-tight font-normal tracking-tight text-ink italic">
          {isHost ? "Your room" : host ? `${host.name}'s room` : "Room"}
        </h1>
        <p className="mt-[clamp(0.45rem,1.25dvh,0.98rem)] text-[length:calc(var(--u)*1.1)] text-muted" aria-label="Race settings">
          {chips.map((c, i) => (
            <span key={c} className="capitalize">
              {i ? <span className="mx-2 opacity-50">·</span> : null}
              {c}
            </span>
          ))}
        </p>
      </header>
      <div className={HOME_REST}>
      <div className={`${HOME_COL_DENSE} my-auto min-h-0 py-0 [--seat:calc(var(--u)*2.5)]`}>
      <section aria-label="Invite friends" className="flex shrink-0 flex-col gap-[calc(var(--u)*0.5)]">
        <div className={FIELD}>
          <span className={`shrink-0 text-muted ${T_SMALL}`}>Code</span>
          <span className="min-w-0 flex-1 truncate font-mono text-[length:var(--u)] tracking-wide text-ink">{state.code}</span>
          <button type="button" onClick={() => void copy("code")} aria-label="Copy room code" title="Copy code" className={ICON_BTN}>
            {copyIcon("code")}
          </button>
        </div>
        <div className="flex min-w-0 gap-[calc(var(--u)*0.5)]">
          <div className={`${FIELD} flex-1 shrink`}>
            <span className="min-w-0 flex-1 truncate font-mono text-[length:calc(var(--u)*0.92)] text-ink" title={link}>{pretty}</span>
            <button type="button" onClick={() => void copy("link")} aria-label="Copy invite link" title="Copy link" className={ICON_BTN}>
              {copyIcon("link")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => void share()}
            aria-label="Share invite link"
            className={`group relative inline-flex size-[calc(var(--u)*2.85)] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-foam text-ink ring-1 ring-line transition-colors hover:ring-teal motion-reduce:transition-none ${RING}`}
          >
            <Icon d={I.share} className={ico} />
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 translate-y-1 rounded-lg bg-card px-2.5 py-1 text-xs whitespace-nowrap text-ink opacity-0 ring-1 ring-line transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
            >
              Share
            </span>
          </button>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {copied === "code" ? "Room code copied" : copied === "link" ? "Invite link copied" : ""}
        </p>
      </section>

      <section aria-labelledby="racers-h" className="flex min-h-[calc(var(--seat)*2+2rem)] shrink flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-line pb-[calc(var(--u)*0.45)]">
          <h2 id="racers-h" className={`text-muted ${T_SMALL}`}>Racers</h2>
          <span className={`font-mono tabular-nums text-muted ${T_SMALL}`} aria-label={`${here.length} of ${max} joined`}>
            <span className="text-ink">{here.length}</span>/{max}
          </span>
        </div>
        <ol className={`-mx-1 mt-[calc(var(--u)*0.45)] grid min-h-0 auto-rows-min gap-1 overflow-y-auto overscroll-contain px-1 pb-0.5 ${max > 5 ? "sm:grid-cols-2 sm:gap-x-3" : ""} ${max > 6 ? "max-sm:grid-cols-2 max-sm:gap-x-2" : ""}`}>
          <AnimatePresence initial={false}>
            {slots.map((p, i) =>
              p ? (
                <motion.li
                  key={p.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
                  className={`${row} ${p.id === youId ? "bg-foam" : ""}`}
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.name}</span>
                  {p.id === youId ? <span className={`shrink-0 text-muted ${T_SMALL}`}>You</span> : null}
                  {p.id === state.hostId ? <span className={`shrink-0 text-teal ${T_SMALL}`}>Host</span> : null}
                </motion.li>
              ) : (
                <li key={`open-${i}`} className={`${row} text-muted/60`}>
                  Waiting…
                </li>
              ),
            )}
          </AnimatePresence>
        </ol>
      </section>

      <div className="shrink-0">
        {isHost ? (
          <PrimaryButton
            label="Start race"
            disabled={!canStart}
            onClick={onStart}
            hint={
              canStart ? (
                <>
                  {full ? "Everyone's in." : "Start now or wait for open seats."}{" "}
                  <span className="max-sm:hidden">
                    Press <kbd className="rounded border border-line px-1 font-mono">Enter</kbd>
                  </span>
                </>
              ) : (
                "Invite at least 1 friend to start."
              )
            }
          />
        ) : (
          <p role="status" className="flex min-h-[calc(var(--u)*2.8)] w-full items-center justify-center gap-3 rounded-xl bg-foam px-6 text-[length:calc(var(--u)*0.92)] text-muted ring-1 ring-line">
            Waiting for {host?.name ?? "the host"} to start <Dots />
          </p>
        )}
      </div>
      </div>
      </div>
      <div className={HOME_BOTTOM}>
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-[calc(var(--u)*0.5)] text-[length:calc(var(--u)*0.92)]">
        {confirmLeave ? (
          <>
            <span className="text-muted">Leave? {nextHost ?? "Someone"} becomes host.</span>
            <button type="button" onClick={leave} className={`${NEUTRAL_BTN} hover:opacity-90`} style={{ background: LEAVE, borderColor: LEAVE, color: "var(--color-abyss)" }}>
              Leave
            </button>
            <button type="button" autoFocus onClick={() => setConfirmLeave(false)} className={NEUTRAL_BTN}>
              Stay
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={leave}
            className={`${NEUTRAL_BTN} bg-transparent hover:bg-[color-mix(in_oklab,#c4605a_14%,transparent)]`}
            style={{ color: LEAVE, borderColor: `color-mix(in oklab, ${LEAVE} 55%, transparent)` }}
          >
            <Icon d={I.exit} className="size-[calc(var(--u)*0.95)]" />
            Leave room
          </button>
        )}
      </div>
      </div>
      <Toast message={toast} onClear={() => setToast(null)} tone="notice" />
      <Toast message={copiedToast} onClear={() => setCopiedToast(null)} tone="success" duration={2000} />
    </div>
  );
}
