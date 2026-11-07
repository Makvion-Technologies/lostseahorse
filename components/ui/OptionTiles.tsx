"use client";

import { MotionConfig, motion } from "motion/react";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tile<T extends string> = {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
};

/** Radio group of chunky tiles: big value, tiny caption, arrow keys move. */
export function OptionTiles<T extends string>({
  labelledBy,
  value,
  options,
  onChange,
}: {
  labelledBy: string;
  value: T;
  options: Tile<T>[];
  onChange: (value: T) => void;
}) {
  const pillId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    let next = -1;
    if (step) next = (index + step + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next]!.value);
    refs.current[next]?.focus();
  };

  return (
    <MotionConfig reducedMotion="user">
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o, i) => {
        const on = i === index;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.ariaLabel}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={onKey}
            className={cn(
              "relative isolate flex min-h-11 min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1 py-1 outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss",
              on
                ? "border-line bg-card text-ink"
                : "border-line bg-card text-muted hover:border-[color-mix(in_oklab,var(--color-teal)_45%,var(--color-line))] hover:text-ink",
            )}
          >
            {on ? (
              <motion.span
                aria-hidden
                layoutId={pillId}
                transition={{ type: "spring", stiffness: 520, damping: 40, mass: 0.8 }}
                className="pointer-events-none absolute -inset-0.5 -z-10 rounded-xl border-2 border-teal bg-[color-mix(in_oklab,var(--color-teal)_16%,var(--color-card))]"
              />
            ) : null}
            <span className="relative font-mono text-base leading-none tabular-nums sm:text-lg">{o.label}</span>
          </button>
        );
      })}
    </div>
    </MotionConfig>
  );
}
