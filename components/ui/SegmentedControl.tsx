"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  layoutId,
  className,
  ariaLabel,
  compact,
  tight,
  locked,
  onLocked,
  itemClassName,
  padClassName,
}: {
  value: T;
  options: { value: T; label: React.ReactNode; ariaLabel?: string }[];
  onChange: (value: T) => void;
  layoutId: string;
  className?: string;
  ariaLabel?: string;
  compact?: boolean;
  tight?: boolean;
  locked?: boolean;
  onLocked?: () => void;
  /** Overrides the item padding/text size (e.g. viewport-scaled pills). */
  itemClassName?: string;
  /** Overrides the container padding. */
  padClassName?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "relative flex rounded-xl bg-foam ring-1 ring-line",
        padClassName ?? "p-1",
        !compact && "w-full",
        locked && "opacity-40",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-label={option.ariaLabel}
            aria-checked={selected}
            onClick={() => {
              if (locked) {
                onLocked?.();
                return;
              }
              onChange(option.value);
            }}
            className={cn(
              "relative z-10 cursor-pointer items-center justify-center rounded-xl outline-none transition-colors",
              compact ? "flex flex-none" : "flex flex-1",
              itemClassName
                ? itemClassName
                : tight
                ? "px-3 py-1.5 text-sm"
                : compact
                  ? "px-4 py-1.5 text-sm sm:px-5"
                  : "px-2.5 py-1.5 text-sm sm:px-3.5",
              "focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss",
              selected ? "text-abyss" : "text-muted hover:text-ink",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-xl bg-teal shadow-[0_8px_24px_-12px_var(--teal)]"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 max-w-full truncate",
                typeof option.label === "string" &&
                  !/\d/.test(option.label) &&
                  "capitalize",
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
