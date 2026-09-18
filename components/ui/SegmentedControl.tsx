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
}: {
  value: T;
  options: { value: T; label: React.ReactNode; ariaLabel?: string }[];
  onChange: (value: T) => void;
  layoutId: string;
  className?: string;
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "relative flex w-full rounded-full bg-foam p-1.5 ring-1 ring-line",
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
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 flex flex-1 cursor-pointer items-center justify-center rounded-full px-3 py-3 text-base tracking-wide outline-none transition-colors sm:px-5",
              "focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss",
              selected ? "text-abyss" : "text-muted hover:text-ink",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-teal shadow-[0_8px_24px_-12px_var(--teal)]"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            ) : null}
            <span
              className={cn(
                "relative z-10",
                typeof option.label === "string" && "capitalize",
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
