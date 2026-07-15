"use client";

import { useGameStore } from "@/game/state/useGameStore";
import { getModeById } from "@/game/constants/modes";
import { cn } from "@/utils/cn";

/**
 * Minimal bottom-center health bar (0–100). Hidden in Zen mode.
 */
export function HealthBar() {
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const selectedMode = useGameStore((s) => s.selectedMode);
  const mode = getModeById(selectedMode);

  if (!mode.hasHealth) return null;

  const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const critical = pct <= 25;
  const low = pct <= 50;

  return (
    <div
      className="pointer-events-none w-[min(18rem,55vw)]"
      role="meter"
      aria-label="Seahorse health"
      aria-valuenow={Math.round(health)}
      aria-valuemin={0}
      aria-valuemax={maxHealth}
    >
      <div className="mb-1.5 flex items-center justify-between text-[9px] tracking-[0.16em] text-cyan-100/45 uppercase sm:text-[10px]">
        <span>Health</span>
        <span
          className={cn(
            "tabular-nums",
            critical ? "text-rose-300/85" : "text-cyan-100/55",
          )}
        >
          {Math.ceil(health)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-slate-950/45 backdrop-blur-xl">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 ease-out",
            critical
              ? "bg-gradient-to-r from-rose-700/90 to-rose-400/90"
              : low
                ? "bg-gradient-to-r from-amber-700/80 to-cyan-500/80"
                : "bg-gradient-to-r from-teal-600/85 to-cyan-300/85",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
