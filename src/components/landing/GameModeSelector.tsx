"use client";

import { GAME_MODES } from "@/game/constants/modes";
import { useGameStore } from "@/game/state/useGameStore";
import { ModeCard } from "@/components/ui/ModeCard";

export function GameModeSelector() {
  const selectedMode = useGameStore((s) => s.selectedMode);
  const setSelectedMode = useGameStore((s) => s.setSelectedMode);

  return (
    <div
      className="relative z-10 flex w-full max-w-4xl flex-wrap items-stretch justify-center gap-3 px-4 sm:gap-3.5"
      role="group"
      aria-label="Game mode"
    >
      {GAME_MODES.map((mode, index) => (
        <ModeCard
          key={mode.id}
          mode={mode}
          selected={selectedMode === mode.id}
          onSelect={() => setSelectedMode(mode.id)}
          index={index}
        />
      ))}
    </div>
  );
}
