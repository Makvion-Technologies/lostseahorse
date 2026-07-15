"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GAME_CONFIG } from "@/game/constants/config";
import { audioManager } from "@/game/audio/AudioManager";

export type CountdownPhase = number | "label" | "done";

interface CountdownProps {
  /** Starting number (default from GAME_CONFIG). */
  from?: number;
  /** Final message before completion. */
  label?: string;
  /** Milliseconds each step is shown. */
  stepDurationMs?: number;
  /** Called when the sequence finishes. */
  onComplete?: () => void;
  className?: string;
}

function buildSequence(from: number): CountdownPhase[] {
  const numbers = Array.from({ length: from }, (_, i) => from - i);
  return [...numbers, "label", "done"];
}

/**
 * Countdown sequence: 3 → 2 → 1 → "Protect the Seahorse"
 */
export function Countdown({
  from = GAME_CONFIG.COUNTDOWN_DURATION_SECONDS,
  label = GAME_CONFIG.COUNTDOWN_LABEL,
  stepDurationMs = 1000,
  onComplete,
  className,
}: CountdownProps) {
  const sequence = buildSequence(from);
  const [stepIndex, setStepIndex] = useState(0);
  const phase = sequence[stepIndex] ?? "done";

  useEffect(() => {
    if (phase === "done") {
      onComplete?.();
      return;
    }

    if (typeof phase === "number" || phase === "label") {
      audioManager.playCountdown();
    }

    const id = window.setTimeout(() => {
      setStepIndex((i) => i + 1);
    }, stepDurationMs);

    return () => window.clearTimeout(id);
  }, [phase, stepDurationMs, onComplete]);

  if (phase === "done") return null;

  const display = phase === "label" ? label : String(phase);

  return (
    <div
      className={
        className ??
        "pointer-events-none flex min-h-[8rem] items-center justify-center"
      }
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={String(phase)}
          initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.08, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={
            phase === "label"
              ? "text-center font-display text-2xl font-medium tracking-[0.14em] text-cyan-50/90 sm:text-3xl md:text-4xl"
              : "font-display text-7xl font-semibold tracking-widest text-white drop-shadow-[0_0_40px_rgba(103,232,249,0.35)] sm:text-8xl md:text-9xl"
          }
        >
          {display}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
