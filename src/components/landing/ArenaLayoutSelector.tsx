"use client";

import {
  ARENA_LAYOUTS,
  type ArenaLayoutId,
} from "@/game/constants/arena";
import { useGameStore } from "@/game/state/useGameStore";
import { audioManager } from "@/game/audio/AudioManager";
import { cn } from "@/utils/cn";

/**
 * Choose seahorse side for all game modes:
 * Left · Center · Right
 */
export function ArenaLayoutSelector() {
  const selected = useGameStore((s) => s.selectedArenaLayout);
  const setLayout = useGameStore((s) => s.setSelectedArenaLayout);

  return (
    <div
      className="relative z-10 flex w-full max-w-xl flex-col items-center gap-2 px-4"
      role="group"
      aria-label="Seahorse position"
    >
      <p className="text-[10px] font-medium tracking-[0.22em] text-cyan-200/55 uppercase">
        Seahorse Position
      </p>
      <div className="flex w-full flex-wrap items-stretch justify-center gap-2">
        {ARENA_LAYOUTS.map((layout) => {
          const active = selected === layout.id;
          return (
            <button
              key={layout.id}
              type="button"
              aria-pressed={active}
              title={layout.description}
              onClick={() => {
                audioManager.playUiClick();
                setLayout(layout.id as ArenaLayoutId);
              }}
              className={cn(
                "min-w-[6.5rem] flex-1 rounded-2xl border px-3 py-2.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 sm:min-w-[7.5rem]",
                active
                  ? "border-cyan-300/45 bg-cyan-400/20 text-cyan-50 shadow-[0_0_24px_-8px_rgba(34,211,238,0.55)]"
                  : "border-white/10 bg-white/5 text-cyan-100/70 hover:border-white/20 hover:bg-white/10",
              )}
            >
              <span className="block text-sm font-semibold tracking-wide">
                {layout.label}
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-cyan-200/45">
                {layout.id === "left" && "Words → left"}
                {layout.id === "center" && "Words both sides"}
                {layout.id === "right" && "Words → right"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
