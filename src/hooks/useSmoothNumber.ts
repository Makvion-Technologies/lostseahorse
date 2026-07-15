"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Smoothly interpolates a displayed number toward a target (HUD flicker control).
 */
export function useSmoothNumber(
  target: number,
  opts?: { speed?: number; decimals?: number },
): number {
  const speed = opts?.speed ?? 8;
  const decimals = opts?.decimals ?? 0;
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const cur = displayRef.current;
      const goal = targetRef.current;
      const next = cur + (goal - cur) * (1 - Math.exp(-speed * dt));
      if (Math.abs(next - goal) < 0.02) {
        displayRef.current = goal;
        setDisplay(goal);
      } else {
        displayRef.current = next;
        setDisplay(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [speed]);

  if (decimals <= 0) return Math.round(display);
  const f = 10 ** decimals;
  return Math.round(display * f) / f;
}
