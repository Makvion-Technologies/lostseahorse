"use client";

import { motion } from "framer-motion";
import { CountUpValue } from "./CountUpValue";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/utils/cn";

export type StatTone = "default" | "good" | "warn" | "bad" | "accent" | "combo";

const valueTone: Record<StatTone, string> = {
  default: "text-cyan-50/90",
  good: "text-emerald-300",
  warn: "text-amber-300",
  bad: "text-rose-300",
  accent: "text-cyan-200",
  combo: "text-violet-300",
};

const heroTone: Record<
  StatTone,
  { card: string; label: string; value: string }
> = {
  default: {
    card: "border-white/10 bg-white/[0.04]",
    label: "text-cyan-100/45",
    value: "text-cyan-50",
  },
  good: {
    card: "border-emerald-400/25 bg-emerald-500/[0.1]",
    label: "text-emerald-200/55",
    value: "text-emerald-100",
  },
  warn: {
    card: "border-amber-400/25 bg-amber-500/[0.1]",
    label: "text-amber-200/55",
    value: "text-amber-100",
  },
  bad: {
    card: "border-rose-400/30 bg-rose-500/[0.1]",
    label: "text-rose-200/55",
    value: "text-rose-200",
  },
  accent: {
    card: "border-cyan-400/25 bg-cyan-500/[0.1]",
    label: "text-cyan-200/50",
    value: "text-cyan-50",
  },
  combo: {
    card: "border-violet-400/25 bg-violet-500/[0.1]",
    label: "text-violet-200/50",
    value: "text-violet-100",
  },
};

interface SharedProps {
  label: string;
  value: number | string;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  delayMs?: number;
  isText?: boolean;
  tone?: StatTone;
}

/** Large featured metric card — only for WPM / Peak / Accuracy. */
export function ResultsHeroStat({
  label,
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  delayMs = 0,
  isText = false,
  tone = "accent",
}: SharedProps) {
  const reduced = useReducedMotion();
  const styles = heroTone[tone];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: reduced ? 0 : delayMs / 1000,
        duration: reduced ? 0 : 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "rounded-2xl border px-3 py-2.5 text-center sm:px-4 sm:py-3",
        styles.card,
      )}
    >
      <p
        className={cn(
          "text-[9px] font-medium tracking-[0.16em] uppercase sm:text-[10px]",
          styles.label,
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-semibold tabular-nums tracking-wide sm:text-3xl",
          styles.value,
        )}
      >
        {isText || typeof value === "string" ? (
          value || "—"
        ) : (
          <CountUpValue
            value={value}
            decimals={decimals}
            suffix={suffix}
            prefix={prefix}
            delayMs={delayMs}
          />
        )}
      </p>
    </motion.div>
  );
}

/** Simple left-label / right-value row — no box. */
export function ResultsStatRow({
  label,
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  delayMs = 0,
  isText = false,
  tone = "default",
}: SharedProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: reduced ? 0 : delayMs / 1000,
        duration: reduced ? 0 : 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="flex items-baseline justify-between gap-4 py-1.5 sm:py-1.5"
    >
      <span className="text-xs text-cyan-100/45 sm:text-[13px]">{label}</span>
      <span
        className={cn(
          "text-right text-sm font-medium tabular-nums sm:text-[15px]",
          valueTone[tone],
        )}
      >
        {isText || typeof value === "string" ? (
          value || "—"
        ) : (
          <CountUpValue
            value={value}
            decimals={decimals}
            suffix={suffix}
            prefix={prefix}
            delayMs={delayMs}
          />
        )}
      </span>
    </motion.div>
  );
}

/** Section heading for grouped rows. */
export function ResultsSectionTitle({
  children,
  delayMs = 0,
}: {
  children: React.ReactNode;
  delayMs?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.p
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduced ? 0 : delayMs / 1000, duration: 0.3 }}
      className="mb-1 mt-3 border-b border-white/[0.07] pb-1 text-[10px] font-semibold tracking-[0.2em] text-cyan-300/40 uppercase first:mt-0"
    >
      {children}
    </motion.p>
  );
}

/** @deprecated */
export function ResultsStatTile(props: SharedProps & { featured?: boolean }) {
  if (props.featured) return <ResultsHeroStat {...props} />;
  return <ResultsStatRow {...props} />;
}
