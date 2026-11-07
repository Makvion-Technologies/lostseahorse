"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

const COLORS = ["var(--teal)", "var(--coral)", "var(--amber)", "var(--wpm)", "var(--ink)"];

/** One-shot confetti burst. Renders nothing for reduced-motion users. */
export function Confetti({ count = 46 }: { count?: number }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(() => {
    // Deterministic spread so renders stay pure.
    return Array.from({ length: count }, (_, i) => {
      const r = (n: number) => {
        const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
        return x - Math.floor(x);
      };
      return {
        left: 8 + r(1) * 84,
        dx: (r(2) - 0.5) * 220,
        rise: 140 + r(3) * 220,
        fall: 260 + r(4) * 360,
        spin: (r(5) - 0.5) * 900,
        delay: r(6) * 0.25,
        dur: 1.6 + r(7) * 0.9,
        w: 6 + Math.round(r(8) * 5),
        round: r(9) > 0.7,
        color: COLORS[i % COLORS.length]!,
      };
    });
  }, [count]);

  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-[38%] block"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.round ? p.w : p.w * 0.45,
            borderRadius: p.round ? 999 : 1,
            background: p.color,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, p.dx * 0.6, p.dx],
            y: [0, -p.rise, p.fall],
            rotate: p.spin,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeOut", times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}
