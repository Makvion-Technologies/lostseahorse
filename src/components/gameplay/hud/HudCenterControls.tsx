"use client";

import { useGameStore } from "@/game/state/useGameStore";
import { useStatsStore } from "@/game/state/useStatsStore";
import { getModeById } from "@/game/constants/modes";
import { useSmoothNumber } from "@/hooks/useSmoothNumber";
import { audioManager } from "@/game/audio/AudioManager";
import { cn } from "@/utils/cn";
import { HudCard } from "./HudCard";

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function PauseIconButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
        "border border-white/10 bg-slate-950/40 text-cyan-50/90 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)]",
        "backdrop-blur-xl transition-colors hover:border-cyan-300/30 hover:bg-white/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60",
      )}
      aria-label="Pause game (Esc)"
      title="Pause (Esc)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M6.5 4.5A1.5 1.5 0 0 1 8 6v12a1.5 1.5 0 0 1-3 0V6A1.5 1.5 0 0 1 6.5 4.5Zm9 0A1.5 1.5 0 0 1 17 6v12a1.5 1.5 0 0 1-3 0V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      </svg>
    </button>
  );
}

/**
 * Top-center HUD row:
 * - Timed / Infinite: Time chip + pause icon
 * - Zen: Finish practice (results) + pause icon
 */
export function HudCenterControls() {
  const selectedMode = useGameStore((s) => s.selectedMode);
  const timer = useGameStore((s) => s.timer);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const endGame = useGameStore((s) => s.endGame);
  const elapsed = useStatsStore((s) => s.elapsedSeconds);
  const mode = getModeById(selectedMode);
  const isZen = mode.id === "zen";

  const countdown = useSmoothNumber(timer, { speed: 10, decimals: 1 });

  const handlePause = () => {
    audioManager.playUiClick();
    pauseGame();
  };

  const handleFinishZen = () => {
    audioManager.playUiClick();
    // End practice → results (manual reason, no seahorse death)
    endGame();
  };

  return (
    <div className="pointer-events-none flex items-center justify-center gap-2 sm:gap-2.5">
      {isZen ? (
        <button
          type="button"
          onClick={handleFinishZen}
          className={cn(
            "pointer-events-auto hud-card flex items-center gap-2 rounded-2xl border border-amber-400/25",
            "bg-slate-950/45 px-3.5 py-2.5 text-left shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)]",
            "backdrop-blur-xl transition-colors hover:border-amber-300/40 hover:bg-amber-400/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50",
          )}
          aria-label="Finish practice and view results"
          title="Finish practice"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              {/* Stop / flag square */}
              <path d="M6 5.5A1.5 1.5 0 0 1 7.5 4h9A1.5 1.5 0 0 1 18 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18.5v-13Z" />
            </svg>
          </span>
          <span className="pr-1">
            <span className="block text-[9px] font-medium tracking-[0.18em] text-amber-100/55 uppercase sm:text-[10px]">
              Practice
            </span>
            <span className="mt-0.5 block font-display text-sm font-medium tracking-wide text-amber-50/95 sm:text-base">
              Finish
            </span>
          </span>
        </button>
      ) : mode.hasTimer ? (
        <HudCard label="Time" align="center">
          <span className="tabular-nums">{formatClock(countdown)}</span>
        </HudCard>
      ) : (
        <HudCard label="Time" align="center">
          <span className="tabular-nums">{formatClock(elapsed)}</span>
        </HudCard>
      )}

      <PauseIconButton onClick={handlePause} />
    </div>
  );
}
