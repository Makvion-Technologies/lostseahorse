"use client";

import type { ReactNode } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/cn";

/** Simple, Solo-style building blocks for the Strangers and Friends homes.
 * Everything sizes off --u (set by HOME_COL), which scales with the viewport. */

/** The home column: width, gaps and type all follow --u. */
const COL_BASE =
  "mx-auto flex w-full min-w-0 flex-col px-1 py-4 [@media(max-height:820px)]:group-has-[[data-name-field]]/page:py-0 [--u:clamp(0.8rem,min(0.93vw,1.6dvh),1.42rem)] max-w-[min(100%,clamp(23rem,30vw,39rem))] lg:max-w-[min(100%,clamp(23rem,max(30vw,calc(19vw+218px)),39rem))] gap-[var(--g)]";
/** Solo-style page frame: the title is pinned at Solo's control offset under the navbar,
 * and the rest is centred in the space left below it (like Solo's timer and passage). */
export const HOME_PAGE = "group/page relative flex min-h-[calc(100dvh-10rem)] w-full min-w-0 flex-col sm:min-h-[calc(100dvh-12rem)]";
/** Title block: same top padding as Solo's controls row. */
export const HOME_TOP = "mx-auto w-full min-w-0 px-1 pt-2 sm:pt-6 lg:pt-10 [--u:clamp(0.8rem,min(0.93vw,1.6dvh),1.42rem)] max-w-[min(100%,clamp(23rem,30vw,39rem))] lg:max-w-[min(100%,clamp(23rem,max(30vw,calc(19vw+218px)),39rem))]";
/** Bottom block: mirrors HOME_TOP. The translate pulls it into main's bottom padding so its gap to the viewport bottom matches the title's gap under the navbar. */
export const HOME_BOTTOM = "mx-auto flex w-full min-w-0 shrink-0 flex-col items-center gap-[clamp(14px,calc(var(--u)*1.15),20px)] px-1 pt-[clamp(0.5rem,1.2dvh,1.25rem)] translate-y-7 lg:translate-y-3 min-[1800px]:translate-y-[3px] min-[2400px]:-translate-y-[5px] [@media(max-height:820px)]:pt-1 [--u:clamp(0.8rem,min(0.93vw,1.6dvh),1.42rem)] max-w-[min(100%,clamp(23rem,30vw,39rem))] lg:max-w-[min(100%,clamp(23rem,max(30vw,calc(19vw+218px)),39rem))]";
/** Everything under the title, centred in the remaining height. */
export const HOME_REST = "flex min-h-0 flex-1 flex-col pt-[clamp(0.75rem,2.5dvh,2.5rem)] [@media(max-height:820px)]:group-has-[[data-name-field]]/page:pt-[clamp(0.5rem,1.2dvh,0.75rem)]";
/** --g is the gap between sections, --r the padding of each settings row. */
export const HOME_COL = cn(COL_BASE, "[--g:clamp(1.55rem,4.9dvh,4rem)] [--r:clamp(0.55rem,1.7dvh,1.42rem)] [@media(max-height:820px)]:group-has-[[data-name-field]]/page:[--g:clamp(0.6rem,2dvh,1.6rem)] [@media(max-height:820px)]:group-has-[[data-name-field]]/page:[--r:clamp(0.4rem,1.1dvh,0.55rem)]");
/** Same column with tighter rhythm, for the taller Friends home. */
export const HOME_COL_DENSE = cn(COL_BASE, "[--g:clamp(0.8rem,2.5dvh,2.65rem)] [--r:clamp(0.3rem,0.9dvh,0.98rem)] [@media(max-height:820px)]:group-has-[[data-name-field]]/page:[--g:clamp(0.35rem,0.7dvh,0.8rem)] [@media(max-height:820px)]:group-has-[[data-name-field]]/page:[--r:clamp(0.25rem,0.6dvh,0.3rem)]");
/** Settings rows with hairlines between them. */
export const HOME_SETTINGS = "flex flex-col divide-y divide-line/60";
/** Padding for one settings row (each row is its own band). */
export const ROW_PAD = "py-[var(--r)] first:pt-0 last:pb-0";
/** Main button plus the quiet meta lines under it. */
export const HOME_ACTIONS = "flex flex-col gap-[clamp(0.8rem,2.3dvh,1.78rem)] [@media(max-height:820px)]:group-has-[[data-name-field]]/page:gap-[clamp(0.5rem,1.2dvh,0.8rem)]";
export const T_BASE = "text-[length:var(--u)]";
export const T_SMALL = "text-[length:calc(var(--u)*0.86)]";

export const RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[length:calc(var(--u,0.875rem)*0.78)] text-ink">{children}</kbd>;
}

/** Small plain page heading with one short line under it. */
export function HomeHeading({ title, line }: { title: string; line: string }) {
  return (
    <header className="text-center">
      <h1 className="text-[length:calc(var(--u)*2.4)] leading-tight font-display font-normal italic tracking-tight text-ink">{title}</h1>
      <p className="mt-[clamp(0.45rem,1.25dvh,0.98rem)] text-[length:calc(var(--u)*1.1)] text-muted">{line}</p>
    </header>
  );
}

/** One labelled Solo-style pill bar. */
export function PillRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
  id,
  extra,
}: {
  label: ReactNode;
  value: T;
  options: { value: T; label: ReactNode; ariaLabel?: string }[];
  onChange: (value: T) => void;
  id: string;
  extra?: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center justify-between gap-x-[calc(var(--u)*2)] gap-y-[calc(var(--u)*0.5)]", ROW_PAD)}>
      <span className={cn(T_BASE, "text-muted")}>{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <SegmentedControl ariaLabel={typeof label === "string" ? label : id} layoutId={`home-${id}`} compact tight value={value} options={options} onChange={onChange} />
        {extra}
      </div>
    </div>
  );
}

/** "Racing as name · Rename" in one plain line. */
export function NameLine({ name, canRename, onRename }: { name: string; canRename: boolean; onRename: () => void }) {
  return (
    <p className="flex min-w-0 flex-wrap items-center justify-center gap-x-[calc(var(--u)*0.5)] text-[length:calc(var(--u)*0.95)] text-muted">
      <span>Racing as</span>
      <span className="max-w-[16rem] truncate font-medium text-ink">{name}</span>
      {canRename ? (
        <button type="button" onClick={onRename} className={cn("cursor-pointer rounded text-teal underline-offset-4 hover:underline", RING)}>
          Rename
        </button>
      ) : null}
    </p>
  );
}

/** Full-width primary button with a quiet hint under it. */
export function PrimaryButton({
  label,
  disabled,
  onClick,
  hint,
  above,
  buttonRef,
  autoFocus,
}: {
  label: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  hint?: ReactNode;
  above?: ReactNode;
  buttonRef?: React.Ref<HTMLButtonElement>;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-[calc(var(--u)*0.5)]">
      {above}
      <button
        ref={buttonRef}
        type="button"
        autoFocus={autoFocus}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "min-h-[calc(var(--u)*2.8)] w-full cursor-pointer rounded-xl bg-teal px-8 text-[length:calc(var(--u)*1.1)] font-medium text-abyss transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-foam disabled:text-muted disabled:hover:opacity-100 motion-reduce:transition-none",
          RING,
        )}
      >
        {label}
      </button>
      {hint ? <p className={cn("text-center text-muted", T_SMALL)}>{hint}</p> : null}
    </div>
  );
}

/** Races · Best · Last in one muted line. */
export function StatLine({ rows }: { rows: string[][] }) {
  return (
    <p className={cn("text-center text-muted", T_SMALL)}>
      {rows.map(([k, v], i) => (
        <span key={k}>
          {i ? <span className="mx-2 opacity-50">·</span> : null}
          {k} <span className="font-mono text-ink">{v}</span>
        </span>
      ))}
    </p>
  );
}

export const NEUTRAL_BTN = cn(
  "inline-flex min-h-[calc(var(--u)*2.5)] cursor-pointer items-center gap-[calc(var(--u)*0.45)] rounded-xl border-2 border-line bg-card px-[calc(var(--u)*1)] text-[length:calc(var(--u)*0.92)] font-medium text-ink transition-colors hover:border-[color-mix(in_oklab,var(--color-ink)_30%,var(--color-line))] hover:bg-[color-mix(in_oklab,var(--color-ink)_6%,var(--color-card))] motion-reduce:transition-none",
  RING,
);
