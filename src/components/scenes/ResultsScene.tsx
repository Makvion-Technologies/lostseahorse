"use client";

import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/game/state/useGameStore";

/**
 * Placeholder results scene.
 * Stats UI and grading land in a later phase.
 */
export function ResultsScene() {
  const restartGame = useGameStore((s) => s.restartGame);

  return (
    <main className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#021018]">
      <div className="ocean-gradient pointer-events-none absolute inset-0" />
      <div className="ocean-vignette pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex max-w-md flex-col items-center gap-6 px-6 text-center">
        <p className="font-display text-sm tracking-[0.2em] text-cyan-200/50 uppercase">
          Results Scene
        </p>
        <p className="text-sm text-slate-400/80">
          Placeholder — WPM, accuracy, and grades are not calculated yet.
        </p>
        <Button variant="ghost" onClick={restartGame}>
          Return Home
        </Button>
      </div>
    </main>
  );
}
