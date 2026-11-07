"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

export function CountUp({
  value,
  delay = 0,
  duration = 1100,
}: {
  value: number;
  delay?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      setShown(Math.round(value * (1 - Math.pow(1 - t, 4))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, delay, duration, reduce]);
  return <>{reduce ? value : shown}</>;
}

/** Small stat with a hover tooltip on desktop and tap-to-reveal on touch. */
export function InlineStat({
  label,
  value,
  hint,
  sub,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Small line under the value, e.g. the previous run's figure. */
  sub?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      onBlur={() => setOpen(false)}
      className="group relative flex min-w-0 cursor-help flex-col items-start rounded-xl px-2 py-1 text-left outline-none transition-colors hover:bg-foam/60 focus-visible:ring-2 focus-visible:ring-[var(--hero)]"
    >
      <span className="text-[0.62rem] uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      <span className="font-display text-[clamp(1rem,0.85rem+0.9vw,1.75rem)] italic leading-tight tabular-nums">
        {value}
      </span>
      {sub ? (
        <span className="text-[11px] leading-tight text-muted tabular-nums md:text-xs">
          {sub}
        </span>
      ) : null}
      {hint ? (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[14rem] -translate-x-1/2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs leading-snug text-ink opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100",
            open && "opacity-100",
          )}
        >
          {hint}
        </span>
      ) : null}
    </button>
  );
}

export function Medal({ place, total }: { place: number; total: number }) {
  const tone =
    place === 1
      ? ["#f7d774", "#c9962b"]
      : place === 2
        ? ["#e6ebf0", "#9aa6b2"]
        : place === 3
          ? ["#f0b98a", "#a8653a"]
          : null;
  const reduce = useReducedMotion();
  if (!tone) {
    return (
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 16 }}
        className="flex items-baseline gap-1 rounded-full border border-line bg-card/70 px-3 py-1 backdrop-blur"
      >
        <span className="font-display text-xl italic tabular-nums">#{place}</span>
        <span className="text-xs text-muted">of {total}</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={reduce ? false : { scale: 0, rotate: -40, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 240, damping: 12 }}
      className="relative h-[clamp(3rem,7dvh,4.75rem)] w-[clamp(3rem,7dvh,4.75rem)]"
      title={`${place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"} of ${total}`}
    >
      <svg viewBox="0 0 64 72" className="h-full w-full drop-shadow-lg">
        <path d="M18 2h10l6 22h-10z" fill="#2a6b6a" />
        <path d="M46 2H36l-6 22h10z" fill="#e76f51" />
        <circle cx="32" cy="44" r="24" fill={tone[1]} />
        <circle cx="32" cy="44" r="19" fill={tone[0]} />
        <text
          x="32"
          y="52"
          textAnchor="middle"
          fontSize="22"
          fontStyle="italic"
          fontWeight="700"
          fill="#3a2a08"
          fontFamily="Georgia, serif"
        >
          {place}
        </text>
      </svg>
    </motion.div>
  );
}

export type PosterAction = {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  tone?: "default" | "accent" | "quiet";
};

function ActionButton({ a, primary }: { a: PosterAction; primary?: boolean }) {
  const cls = cn(
    "group/act inline-flex min-h-11 min-w-0 items-center justify-center rounded-full tracking-wide outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--hero)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
    primary
      ? "gap-2 bg-ink px-6 text-sm font-medium text-abyss shadow-[0_0_0_0_var(--hero)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-6px_var(--hero)]"
      : "flex-col gap-0.5 rounded-2xl py-1.5 text-[0.68rem] sm:flex-row sm:gap-2 sm:rounded-full sm:py-0 sm:text-sm",
    !primary && (a.tone === "accent"
        ? "border border-[color-mix(in_oklab,var(--hero)_55%,transparent)] bg-[color-mix(in_oklab,var(--hero)_14%,transparent)] px-1 sm:px-3 text-ink hover:-translate-y-0.5 hover:bg-[color-mix(in_oklab,var(--hero)_24%,transparent)]"
        : a.tone === "quiet"
          ? "px-1 sm:px-3 text-muted hover:text-ink"
          : "border border-line bg-card/50 px-1 sm:px-3 text-ink backdrop-blur hover:-translate-y-0.5 hover:bg-foam"),
  );
  const inner = (
    <>
      {a.icon ? (
        <span className="shrink-0 transition-transform group-hover/act:scale-110">
          {a.icon}
        </span>
      ) : null}
      <span className="truncate">{a.label}</span>
    </>
  );
  if (a.href) {
    return (
      <a
        href={a.href}
        className={cls}
        {...(a.external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={a.onClick} disabled={a.disabled}>
      {inner}
    </button>
  );
}

export function ResultsPoster({
  color,
  badge,
  wpm,
  wpmHint,
  accuracy,
  chart,
  stats,
  strip,
  primary,
  actions,
  overlay,
  legendExtra,
  wpmSub,
  accSub,
  headline,
  inline = false,
}: {
  color: string;
  badge?: ReactNode;
  wpm: number;
  wpmHint?: string;
  accuracy: number;
  chart: ReactNode;
  stats: ReactNode;
  strip?: ReactNode;
  primary: PosterAction;
  actions: PosterAction[];
  overlay?: ReactNode;
  /** Extra legend entry (e.g. the previous run's line). */
  legendExtra?: ReactNode;
  wpmSub?: ReactNode;
  accSub?: ReactNode;
  /** Short line shown above the graph. */
  headline?: ReactNode;
  /** Render in page flow (scrollable) instead of a fixed full-screen sheet. */
  inline?: boolean;
}) {
  const reduce = useReducedMotion();
  const item = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  };
  const big =
    "font-display italic leading-[0.85] tabular-nums text-[clamp(2.8rem,min(15vw,10dvh),5rem)] md:text-[clamp(3.5rem,min(7.5vw,15dvh),9rem)]";
  const label =
    "text-[clamp(0.65rem,0.55rem+0.4vw,0.95rem)] uppercase tracking-[0.28em] text-muted";

  return (
    <div
      className={
        inline
          ? "relative flex w-full flex-col"
          : "fixed inset-0 z-10 flex flex-col overflow-clip bg-abyss"
      }
      style={{ ["--hero" as string]: color }}
    >

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className={
          inline
            ? "relative mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-[90rem] flex-col gap-[clamp(0.5rem,1.8dvh,1.5rem)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            : "relative mx-auto flex h-full min-h-0 w-full max-w-[90rem] flex-col gap-[clamp(0.5rem,1.8dvh,1.5rem)] px-4 pt-[clamp(4.25rem,10dvh,6.5rem)] pb-[max(calc(clamp(0.5rem,1.6dvh,1.4rem)+clamp(0.8rem,min(0.93vw,1.6dvh),1.42rem)*1.6),env(safe-area-inset-bottom))] sm:px-8 lg:w-[min(82vw,90rem)] lg:px-0"
        }
      >
        {/* score + graph */}
        <section
          aria-label="Your result"
          className="mt-auto flex min-h-0 flex-col justify-center gap-[clamp(0.75rem,2.5dvh,1.5rem)] md:flex-row md:items-center md:gap-[clamp(1rem,3vw,3rem)]"
        >
          <motion.div
            variants={item}
            className="flex shrink-0 items-end gap-[clamp(1.25rem,6vw,3rem)] md:w-[clamp(10rem,17vw,19rem)] md:flex-col md:items-start md:justify-center md:gap-[clamp(0.75rem,3dvh,2.25rem)]"
          >
            <div title={wpmHint}>
              <p className={label}>wpm</p>
              <p className={cn(big, "text-[var(--wpm)]")}>
                <CountUp value={wpm} delay={200} />
              </p>
              {wpmSub ? <div className="mt-1">{wpmSub}</div> : null}
            </div>
            <div>
              <p className={label}>acc</p>
              <p className={big}>
                <CountUp value={Math.round(accuracy)} delay={350} />
                <span className="text-[0.45em] text-muted">%</span>
              </p>
              {accSub ? <div className="mt-1">{accSub}</div> : null}
            </div>
            {badge ? <div className="ml-auto self-center md:ml-0 md:self-start">{badge}</div> : null}
          </motion.div>

          <motion.div
            variants={item}
            className="relative flex min-w-0 flex-col md:flex-1"
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
              {headline ?? <span>speed over time</span>}
              <span className="flex items-center gap-3 text-[12px] normal-case tracking-normal sm:gap-4 md:text-[14px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-[3px] w-4 rounded-full bg-teal md:w-5" /> wpm
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 border-t-2 border-dashed border-muted md:w-5" /> raw
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-coral md:h-2.5 md:w-2.5" /> error
                </span>
                {legendExtra}
                <span className="hidden items-center gap-1.5 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-amber md:h-2.5 md:w-2.5" /> missed
                </span>
              </span>
            </div>
            <div className="mx-auto aspect-[2.2/1] max-h-[clamp(140px,28dvh,300px)] w-full max-w-full md:aspect-[3.8/1]">{chart}</div>
          </motion.div>
        </section>

        <motion.div
          variants={item}
          className={cn(!strip && "mb-auto", "mt-[clamp(16px,3dvh,40px)] grid shrink-0 grid-cols-3 gap-x-2 gap-y-1 border-t border-line pt-[clamp(0.35rem,1.2dvh,0.9rem)] sm:flex sm:flex-wrap sm:justify-between")}
        >
          {stats}
        </motion.div>

        {strip ? (
          <motion.div variants={item} className="mb-auto shrink-0 short:hidden">
            {strip}
          </motion.div>
        ) : null}

        <motion.nav
          variants={item}
          aria-label="What next"
          className="flex shrink-0 flex-col gap-2 rounded-[1.75rem] border border-line bg-card/55 p-2 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
        >
          <ActionButton a={primary} primary />
          <div
            className="grid gap-1.5 sm:flex sm:flex-wrap sm:justify-end"
            style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
          >
            {actions.map((a) => (
              <ActionButton key={a.key} a={a} />
            ))}
          </div>
        </motion.nav>
      </motion.div>

      <AnimatePresence>{overlay}</AnimatePresence>
    </div>
  );
}

export function SheetCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="flex h-11 w-11 cursor-pointer items-center justify-center justify-self-end rounded-xl text-2xl leading-none text-coral ring-1 ring-coral/35 outline-none hover:bg-coral/10 focus-visible:ring-2 focus-visible:ring-coral"
    >
      ×
    </button>
  );
}

/** Bottom sheet for secondary detail (charts, replay, share card). */
export function PosterSheet({
  title,
  onClose,
  children,
  hideHeader = false,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Child renders its own header (e.g. Replay with a centred clock). */
  hideHeader?: boolean;
  /** Size to content (Replay matches the typing column width). */
  wide?: boolean;
}) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div
      key="sheet"
      className={cn("absolute inset-0 z-40 flex items-end justify-center bg-abyss/60 backdrop-blur-sm sm:items-center", wide ? "p-0 sm:p-2 lg:p-6" : "p-2 sm:p-6")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={reduce ? false : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={reduce ? undefined : { y: 40, opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className={cn("scroll flex max-h-[min(88dvh,46rem)] flex-col overflow-y-auto rounded-3xl border border-line bg-card shadow-2xl", wide ? "w-auto max-w-full overflow-x-hidden px-[15px] py-4 sm:px-[23px] sm:py-6 lg:p-6" : "w-full max-w-4xl p-4 sm:p-6")}
      >
        {!hideHeader && (
          <div className="mb-3 grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
            <span aria-hidden />
            <p className="text-center text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
            <SheetCloseButton onClose={onClose} />
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

export const Icons = {
  again: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  solo: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <rect x="3" y="7" width="18" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 11h1M10 11h1M13 11h1M16 11h1M8 14.5h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  invite: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <circle cx="9" cy="9" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M18 8v6M15 11h6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
  repeat: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ghost: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M5 20V11a7 7 0 0 1 14 0v9l-2.3-1.6L14.3 20 12 18.4 9.7 20l-2.4-1.6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="9.5" cy="11" r="1" fill="currentColor" /><circle cx="14.5" cy="11" r="1" fill="currentColor" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M8 5.5v13l10-6.5z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M4 19h16M6 15l4-5 3 3 5-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};
