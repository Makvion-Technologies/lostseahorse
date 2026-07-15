"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";
import { useStatsStore } from "@/game/state/useStatsStore";
import { HudCard } from "./HudCard";

export function HudCombo() {
  const combo = useStatsStore((s) => s.combo);
  const controls = useAnimation();
  const prev = useRef(combo);

  useEffect(() => {
    if (combo > prev.current) {
      void controls.start({
        scale: [1, 1.12, 1],
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      });
    }
    prev.current = combo;
  }, [combo, controls]);

  return (
    <HudCard label="Combo" align="left">
      <motion.span
        animate={controls}
        className={
          combo > 0
            ? "inline-block tabular-nums text-teal-200/95 drop-shadow-[0_0_12px_rgba(45,212,191,0.35)]"
            : "inline-block tabular-nums text-cyan-50/70"
        }
      >
        x{combo}
      </motion.span>
    </HudCard>
  );
}
