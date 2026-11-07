"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BOT_NAMES, suggestName } from "@/lib/racerNames";

function randomName(prev: string): string {
  for (let i = 0; i < 4; i++) {
    const n =
      Math.random() < 0.7
        ? BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]!
        : suggestName();
    if (n !== prev) return n;
  }
  return suggestName();
}

/** Slot-machine name: rolls through names until `locked` arrives, then settles on it. */
export function NameRoll({ locked, className }: { locked: string | null; className?: string }) {
  const reduce = useReducedMotion();
  const [name, setName] = useState("\u2026");

  useEffect(() => {
    if (locked || reduce) return;
    const id = window.setInterval(() => setName((prev) => randomName(prev)), 360);
    return () => window.clearInterval(id);
  }, [locked, reduce]);

  const shown = locked ?? (reduce ? "\u2026" : name);

  return (
    <span className={"relative inline-flex h-[1.3em] min-w-0 items-center overflow-hidden " + (className ?? "")}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={locked ? "locked:" + locked : shown}
          className={"block truncate " + (locked ? "text-teal" : "text-muted")}
          initial={reduce ? false : { y: "100%", opacity: 0 }}
          animate={
            reduce
              ? { opacity: 1 }
              : locked
                ? { y: 0, opacity: 1, scale: [1, 1.08, 1] }
                : { y: 0, opacity: 1 }
          }
          exit={reduce ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
          transition={
            locked
              ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0.3, ease: [0.45, 0, 0.25, 1] }
          }
        >
          {shown}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Centred "You vs Them" line. */
export function VsLine({ me, children }: { me: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full min-w-0 items-center justify-center gap-3 font-mono text-xl sm:gap-5 sm:text-3xl">
      <span className="min-w-0 flex-1 truncate text-right text-ink">{me}</span>
      <span className="shrink-0 text-sm text-muted sm:text-base">vs</span>
      <span className="flex min-w-0 flex-1 justify-start text-left">{children}</span>
    </div>
  );
}
