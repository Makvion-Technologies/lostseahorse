"use client";

import { motion } from "framer-motion";
import type { ModeDefinition } from "@/game/constants/modes";
import { cn } from "@/utils/cn";
import { audioManager } from "@/game/audio/AudioManager";

interface ModeCardProps {
  mode: ModeDefinition;
  selected: boolean;
  onSelect: () => void;
  index: number;
}

export function ModeCard({ mode, selected, onSelect, index }: ModeCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        audioManager.playUiClick();
        onSelect();
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.35 + index * 0.06,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative min-w-[8.5rem] flex-1 cursor-pointer rounded-2xl border px-4 py-4 text-left backdrop-blur-xl transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50",
        selected
          ? "border-cyan-300/50 bg-cyan-400/15 shadow-[0_0_32px_-10px_rgba(34,211,238,0.55)]"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]",
      )}
      aria-pressed={selected}
    >
      {selected && (
        <motion.span
          layoutId="mode-glow"
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-transparent"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <span
        className={cn(
          "relative block text-sm font-semibold tracking-wide",
          selected ? "text-cyan-50" : "text-cyan-50/85",
        )}
      >
        {mode.label}
      </span>
      <span
        className={cn(
          "relative mt-1 block text-xs",
          selected ? "text-cyan-100/70" : "text-slate-300/55",
        )}
      >
        {mode.description}
      </span>
    </motion.button>
  );
}
