"use client";

import { WORD_PACK_META, type WordPackId } from "@/game/data/wordPacks";
import { useGameStore } from "@/game/state/useGameStore";
import { audioManager } from "@/game/audio/AudioManager";
import { cn } from "@/utils/cn";

export function WordPackSelector() {
  const selected = useGameStore((s) => s.selectedWordPack);
  const setSelected = useGameStore((s) => s.setSelectedWordPack);

  return (
    <div
      className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-2 px-4"
      role="group"
      aria-label="Word pack"
    >
      <p className="text-[10px] font-medium tracking-[0.22em] text-cyan-200/55 uppercase">
        Word Pack
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {WORD_PACK_META.map((pack) => {
          const active = selected === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              aria-pressed={active}
              title={pack.description}
              onClick={() => {
                audioManager.playUiClick();
                setSelected(pack.id as WordPackId);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-[11px] tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 sm:text-xs",
                active
                  ? "border-cyan-300/45 bg-cyan-400/20 text-cyan-50 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)]"
                  : "border-white/10 bg-white/5 text-cyan-100/70 hover:border-white/20 hover:bg-white/10",
              )}
            >
              {pack.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
