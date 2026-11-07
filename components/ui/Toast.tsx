"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function Toast({
  message,
  onClear,
  tone = "error",
  duration = 2800,
}: {
  message: string | null;
  onClear: () => void;
  tone?: "error" | "notice" | "success";
  /** How long it stays up, in ms. */
  duration?: number;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onClear, duration);
    return () => window.clearTimeout(id);
  }, [message, onClear, duration]);

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          role="status"
          className={
            tone === "success"
              ? "pointer-events-none fixed top-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-teal px-5 py-2.5 text-sm font-medium text-abyss shadow-[0_16px_40px_-20px_rgba(0,0,0,0.6)]"
              : tone === "notice"
              ? "pointer-events-none fixed top-8 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-teal/25 bg-teal/10 px-5 py-3 text-sm shadow-[0_16px_40px_-24px_rgba(0,0,0,0.5)] text-[color-mix(in_srgb,var(--teal)_60%,var(--muted))]"
              : "pointer-events-none fixed top-8 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-coral/35 bg-coral/12 px-5 py-3 text-sm text-coral shadow-[0_16px_40px_-24px_rgba(0,0,0,0.5)]"
          }
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: tone === "success" ? -28 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: tone === "success" ? -28 : -10 }}
          transition={{ duration: reduce ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
