"use client";

import { cn } from "@/lib/cn";
import { SegmentedControl } from "./SegmentedControl";

export function GoalToggle({
  value,
  onChange,
  className,
  layoutId = "goal",
}: {
  value: "time" | "words";
  onChange: (value: "time" | "words") => void;
  className?: string;
  layoutId?: string;
}) {
  return (
    <SegmentedControl
      ariaLabel="Time or words"
      layoutId={layoutId}
      compact
      className={cn("w-auto shrink-0", className)}
      value={value}
      options={[
        { value: "time", label: "Time" },
        { value: "words", label: "Words" },
      ]}
      onChange={onChange}
    />
  );
}

export function ExtraToggles({
  punctuation,
  numbers,
  onChange,
  className,
  locked,
  onLocked,
}: {
  punctuation: boolean;
  numbers: boolean;
  onChange: (next: { punctuation: boolean; numbers: boolean }) => void;
  className?: string;
  locked?: boolean;
  onLocked?: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Punctuation and numbers"
      className={cn(
        "flex shrink-0 rounded-xl bg-foam p-1 ring-1 ring-line",
        locked && "opacity-40",
        className,
      )}
    >
      <Toggle
        pressed={punctuation}
        ariaLabel="Punctuation"
        onClick={() => {
          if (locked) {
            onLocked?.();
            return;
          }
          onChange({ punctuation: !punctuation, numbers });
        }}
      >
        Punctuations
      </Toggle>
      <Toggle
        pressed={numbers}
        ariaLabel="Numbers"
        onClick={() => {
          if (locked) {
            onLocked?.();
            return;
          }
          onChange({ punctuation, numbers: !numbers });
        }}
      >
        Numbers
      </Toggle>
    </div>
  );
}

function Toggle({
  pressed,
  onClick,
  ariaLabel,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl px-3 py-1.5 text-sm tracking-wide outline-none transition-colors sm:px-4",
        "focus-visible:ring-2 focus-visible:ring-teal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss",
        pressed ? "text-teal" : "text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
