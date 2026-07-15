"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSettingsStore } from "@/game/state/useSettingsStore";
import { useGameStore } from "@/game/state/useGameStore";
import { isWordPackId } from "@/game/data/wordPacks";
import { isArenaLayoutId } from "@/game/constants/arena";
import { spawnSystem } from "@/game/systems/SpawnSystem";
import { audioManager } from "@/game/audio/AudioManager";
import { SettingsPanel } from "@/components/ui/SettingsPanel";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

/**
 * Client bootstrap: hydrate settings, word pack, arena layout, audio, loading gate.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const hydrate = useSettingsStore((s) => s.hydrateFromStorage);
  const setSelectedWordPack = useGameStore((s) => s.setSelectedWordPack);
  const setSelectedArenaLayout = useGameStore((s) => s.setSelectedArenaLayout);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    hydrate();
    audioManager.init();

    try {
      const pack = localStorage.getItem("lostseahorse.wordPack");
      if (pack && isWordPackId(pack)) {
        setSelectedWordPack(pack);
        spawnSystem.setWordPack(pack);
      }
      const layout = localStorage.getItem("lostseahorse.arenaLayout");
      if (layout && isArenaLayoutId(layout)) {
        setSelectedArenaLayout(layout);
      }
    } catch {
      // ignore
    }

    let frame = 0;
    const start = performance.now();
    const duration = 700;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(t);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setReady(true);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [hydrate, setSelectedWordPack, setSelectedArenaLayout]);

  return (
    <>
      {!ready && (
        <LoadingScreen progress={progress} label="Preparing the deep…" />
      )}
      <div
        className={ready ? "contents" : "pointer-events-none invisible"}
        aria-hidden={!ready}
      >
        {children}
      </div>
      <SettingsPanel />
    </>
  );
}
