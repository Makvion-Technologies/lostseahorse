"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/game/state/useGameStore";
import { useEnemyStore } from "@/game/state/useEnemyStore";
import { getModeById } from "@/game/constants/modes";
import { GameStatus } from "@/game/types/GameStatus";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { useStatsStore } from "@/game/state/useStatsStore";
import { useSettingsStore } from "@/game/state/useSettingsStore";
import { cn } from "@/utils/cn";

const COLLAPSE_KEY = "lostseahorse.debug.collapsed";

/**
 * Development-only debug overlay.
 * Hidden in production. Off by default in dev — enable via Settings → Show Debug.
 * When enabled, starts as a small chip so it never steals the playfield.
 */
export function DebugPanel() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return <DebugPanelGate />;
}

function DebugPanelGate() {
  const showDebug = useSettingsStore((s) => s.showDebug);
  if (!showDebug) return null;
  return <DebugPanelInner />;
}

function DebugPanelInner() {
  const setShowDebug = useSettingsStore((s) => s.setShowDebug);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      // Default collapsed unless user explicitly expanded
      setCollapsed(raw !== "false");
    } catch {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const gameStatus = useGameStore((s) => s.gameStatus);
  const selectedMode = useGameStore((s) => s.selectedMode);
  const health = useGameStore((s) => s.health);
  const elapsedPlayTime = useGameStore((s) => s.elapsedPlayTime);
  const difficultyMultiplier = useGameStore((s) => s.difficultyMultiplier);
  const spawnRate = useGameStore((s) => s.spawnRate);
  const activeEnemyCount = useGameStore((s) => s.activeEnemyCount);
  const timer = useGameStore((s) => s.timer);
  const wordsMissed = useGameStore((s) => s.wordsMissed);
  const wordsDestroyed = useGameStore((s) => s.wordsDestroyed);
  const setGameStatus = useGameStore((s) => s.setGameStatus);
  const restartGame = useGameStore((s) => s.restartGame);
  const endGame = useGameStore((s) => s.endGame);

  const activeEnemyId = useEnemyStore((s) => s.activeEnemyId);
  const expectedLetter = useEnemyStore((s) => s.expectedLetter);
  const enemies = useEnemyStore((s) => s.enemies);
  const active = enemies.find((e) => e.id === activeEnemyId) ?? null;

  const rawWpm = useStatsStore((s) => s.rawWpm);
  const peakWpm = useStatsStore((s) => s.peakWpm);
  const avgReaction = useStatsStore((s) => s.averageReactionTime);
  const correctCharacters = useStatsStore((s) => s.correctCharacters);
  const correctWords = useStatsStore((s) => s.correctWords);
  const incorrectKeys = useStatsStore((s) => s.incorrectKeystrokes);
  const statsCombo = useStatsStore((s) => s.combo);
  const highestCombo = useStatsStore((s) => s.highestCombo);

  const [combatStats, setCombatStats] = useState(() =>
    combatRuntime.getDebug(),
  );
  useEffect(() => {
    if (collapsed) return;
    const id = window.setInterval(() => {
      setCombatStats(combatRuntime.getDebug());
    }, 100);
    return () => window.clearInterval(id);
  }, [collapsed]);

  const mode = getModeById(selectedMode);

  // Compact floating chip — zero layout impact on the game
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggleCollapsed}
        className={cn(
          "pointer-events-auto fixed bottom-3 left-3 z-[100]",
          "rounded-full border border-cyan-400/25 bg-slate-950/80 px-3 py-1.5",
          "font-mono text-[10px] tracking-wide text-cyan-200/80 shadow-lg backdrop-blur-md",
          "hover:border-cyan-300/40 hover:text-cyan-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50",
        )}
        aria-label="Expand debug panel"
        title={`${gameStatus} · click to expand`}
      >
        <span className="text-cyan-400/70">dbg</span>{" "}
        <span className="text-cyan-50/90">{gameStatus}</span>
      </button>
    );
  }

  return (
    <aside
      className={cn(
        "pointer-events-auto fixed bottom-3 left-3 z-[100]",
        "max-h-[min(70vh,28rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto",
        "rounded-xl border border-cyan-400/20 bg-slate-950/90 px-3 py-2.5",
        "font-mono text-[10px] leading-relaxed text-cyan-100/80 shadow-lg backdrop-blur-md",
      )}
      aria-label="Debug panel"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold tracking-[0.18em] text-cyan-300/70 uppercase">
          Debug · Dev Only
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded px-1.5 py-0.5 text-[9px] text-cyan-200/60 hover:bg-white/10 hover:text-cyan-50"
            aria-label="Collapse debug panel"
          >
            collapse
          </button>
          <button
            type="button"
            onClick={() => setShowDebug(false)}
            className="rounded px-1.5 py-0.5 text-[9px] text-cyan-200/60 hover:bg-white/10 hover:text-cyan-50"
            aria-label="Hide debug panel"
            title="Hide (Settings → Show Debug)"
          >
            hide
          </button>
        </div>
      </div>

      <dl className="space-y-0.5">
        <Row label="State" value={gameStatus} />
        <Row label="Mode" value={`${mode.label} (${mode.id})`} />
        <Row label="Health" value={String(Math.round(health))} />
        <Row label="Elapsed" value={`${elapsedPlayTime.toFixed(1)}s`} />
        <Row label="Diff×" value={difficultyMultiplier.toFixed(2)} />
        <Row label="Spawn/s" value={spawnRate.toFixed(2)} />
        <Row label="Active" value={String(activeEnemyCount)} />
        <Row label="Timer" value={String(Math.ceil(timer))} />
        <Row label="Missed" value={String(wordsMissed)} />
        <Row label="Killed" value={String(wordsDestroyed)} />
      </dl>

      <p className="mb-1 mt-2 text-[9px] font-semibold tracking-[0.14em] text-teal-300/70 uppercase">
        Typing
      </p>
      <dl className="space-y-0.5">
        <Row label="Word" value={active?.originalText ?? "—"} />
        <Row label="Typed" value={active?.typedCharacters || "—"} />
        <Row label="Left" value={active?.remainingText || "—"} />
        <Row label="Expect" value={expectedLetter ?? "—"} />
      </dl>

      <p className="mb-1 mt-2 text-[9px] font-semibold tracking-[0.14em] text-violet-300/70 uppercase">
        Stats
      </p>
      <dl className="space-y-0.5">
        <Row label="RawWPM" value={rawWpm.toFixed(1)} />
        <Row label="PeakWPM" value={peakWpm.toFixed(1)} />
        <Row label="React" value={`${avgReaction.toFixed(2)}s`} />
        <Row label="OK chr" value={String(correctCharacters)} />
        <Row label="OK wrd" value={String(correctWords)} />
        <Row label="Wrong" value={String(incorrectKeys)} />
        <Row label="Combo" value={`x${statsCombo} (hi ${highestCombo})`} />
      </dl>

      <p className="mb-1 mt-2 text-[9px] font-semibold tracking-[0.14em] text-amber-300/70 uppercase">
        Combat
      </p>
      <dl className="space-y-0.5">
        <Row label="Projs" value={String(combatStats.projectilesAlive)} />
        <Row
          label="Anims"
          value={String(combatStats.activeCombatAnimations)}
        />
        <Row label="Explode" value={String(combatStats.pendingExplosions)} />
      </dl>

      <div className="mt-2 flex flex-wrap gap-1 border-t border-white/10 pt-2">
        {(
          [
            GameStatus.LANDING,
            GameStatus.COUNTDOWN,
            GameStatus.PLAYING,
            GameStatus.GAME_OVER,
            GameStatus.RESULTS,
          ] as const
        ).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setGameStatus(status)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[9px] transition-colors",
              gameStatus === status
                ? "bg-cyan-400/25 text-cyan-50"
                : "bg-white/5 text-cyan-100/60 hover:bg-white/10",
            )}
          >
            {status}
          </button>
        ))}
        <button
          type="button"
          onClick={endGame}
          className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-cyan-100/60 hover:bg-white/10"
        >
          endGame()
        </button>
        <button
          type="button"
          onClick={restartGame}
          className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-cyan-100/60 hover:bg-white/10"
        >
          restart
        </button>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 text-cyan-500/70">{label}</dt>
      <dd className="truncate text-cyan-50/90">{value}</dd>
    </div>
  );
}
