"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Modal } from "./Modal";
import { formatDuration } from "@/lib/formatTime";
import { parseDuration } from "@/lib/parseDuration";
import { isTimeLimit } from "@/lib/types";

export function CustomTimeModal({
  open,
  current,
  onClose,
  onApply,
}: {
  open: boolean;
  current: number;
  onClose: () => void;
  onApply: (seconds: number) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="h-[28rem] max-w-md overflow-hidden p-0"
    >
      {open ? (
        <TimeFields current={current} onClose={onClose} onApply={onApply} />
      ) : null}
    </Modal>
  );
}

function TimeFields({
  current,
  onClose,
  onApply,
}: {
  current: number;
  onClose: () => void;
  onApply: (seconds: number) => void;
}) {
  const [rules, setRules] = useState(false);
  const [draft, setDraft] = useState(current === 0 ? "0" : String(current));
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const parsed = parseDuration(draft);
  const valid = parsed != null && isTimeLimit(parsed);

  useEffect(() => {
    if (rules) return;
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(id);
  }, [rules]);

  const apply = () => {
    if (!valid || parsed == null) return;
    onApply(parsed);
    onClose();
  };

  const hint = !draft.trim() || !valid
    ? "A number is seconds. Or try 1m, 1h, 0."
    : parsed === 0
      ? "Open run. Esc when you want results."
      : formatDuration(parsed);

  const slide = reduce
    ? { duration: 0 }
    : { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="relative h-full overflow-hidden">
      <div className="flex h-full flex-col px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-3xl italic">Custom time</p>
            <p className="mt-2 text-sm text-muted">
              Set how long you want to type.
            </p>
          </div>
          <button
            type="button"
            aria-label="Rules"
            onClick={() => setRules(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted outline-none ring-1 ring-line hover:text-ink focus-visible:ring-2 focus-visible:ring-teal"
          >
            <span className="font-display text-lg italic">?</span>
          </button>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <label className="block text-center">
            <span className="text-xs uppercase tracking-[0.18em] text-muted">
              Duration
            </span>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) =>
                setDraft(e.target.value.toLowerCase().replace(/[^0-9hms\s]/g, ""))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") apply();
              }}
              placeholder="90 or 1m"
              className="mt-3 w-full rounded-2xl border border-line bg-transparent px-5 py-4 text-center font-sans text-3xl tracking-wide outline-none placeholder:text-muted/40 focus:border-teal"
            />
          </label>
          <p className="mt-3 min-h-6 text-center text-sm text-muted">{hint}</p>
        </div>
        <button
          type="button"
          disabled={!valid}
          onClick={apply}
          className="w-full cursor-pointer rounded-full bg-teal px-5 py-3.5 text-base text-abyss outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply
        </button>
      </div>

      <motion.div
        className="absolute inset-0 flex flex-col bg-card px-8 py-8"
        initial={false}
        animate={{ y: rules ? "0%" : "-100%" }}
        transition={slide}
      >
        <p className="font-display text-3xl italic">How time works</p>
        <div className="flex flex-1 flex-col justify-center space-y-5 text-[0.95rem] leading-7 text-muted">
          <p>
            Type a number. That is seconds.{" "}
            <span className="text-ink">15</span> means fifteen seconds.
          </p>
          <p>
            Want minutes or hours? Put{" "}
            <span className="text-ink">m</span> or{" "}
            <span className="text-ink">h</span> after the number.{" "}
            <span className="text-ink">1h30m</span> means one hour and thirty
            minutes.
          </p>
          <p>
            Type <span className="text-ink">0</span> if you do not want a
            timer. When you are finished, press{" "}
            <span className="text-ink">Esc</span> to stop and see your results.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRules(false)}
          className="w-full cursor-pointer rounded-full bg-teal px-5 py-3.5 text-base text-abyss outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          Back to time
        </button>
      </motion.div>
    </div>
  );
}
