"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function Toast({
  message,
  onClear,
  tone = "error",
}: {
  message: string | null;
  onClear: () => void;
  tone?: "error" | "notice";
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onClear, 2800);
    return () => window.clearTimeout(id);
  }, [message, onClear]);

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          role="status"
          className={
            tone === "notice"
              ? "pointer-events-none fixed top-8 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-teal/25 bg-teal/10 px-5 py-3 text-sm shadow-[0_16px_40px_-24px_rgba(0,0,0,0.5)] text-[color-mix(in_srgb,var(--teal)_60%,var(--muted))]"
              : "pointer-events-none fixed top-8 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-coral/35 bg-coral/12 px-5 py-3 text-sm text-coral shadow-[0_16px_40px_-24px_rgba(0,0,0,0.5)]"
          }
          initial={reduce ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -10 }}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
