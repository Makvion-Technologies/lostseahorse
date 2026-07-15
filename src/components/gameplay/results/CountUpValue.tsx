"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { RESULTS_COUNT_UP_MS } from "@/game/constants/results";

interface CountUpValueProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  delayMs?: number;
  durationMs?: number;
  format?: (n: number) => string;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Counts from 0 → value with smooth easing after optional delay.
 */
export function CountUpValue({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  delayMs = 0,
  durationMs = RESULTS_COUNT_UP_MS,
  format,
}: CountUpValueProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => (reduced ? value : 0));

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    let startAt = 0;
    let started = false;

    const tick = (now: number) => {
      if (!started) {
        if (now < startAt) {
          frame = requestAnimationFrame(tick);
          return;
        }
        started = true;
        startAt = now;
      }
      const t = Math.min(1, (now - startAt) / durationMs);
      const eased = easeOutCubic(t);
      setDisplay(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else setDisplay(value);
    };

    const delayTimer = window.setTimeout(() => {
      startAt = performance.now();
      frame = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(delayTimer);
      cancelAnimationFrame(frame);
    };
  }, [value, delayMs, durationMs, reduced]);

  const shown = reduced ? value : display;

  if (format) return <>{format(shown)}</>;

  const formatted =
    decimals > 0 ? shown.toFixed(decimals) : String(Math.round(shown));

  return (
    <span className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
