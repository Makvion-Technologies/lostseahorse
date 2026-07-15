"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { LandingTitle } from "./LandingTitle";
import { GameModeSelector } from "./GameModeSelector";
import { ArenaLayoutSelector } from "./ArenaLayoutSelector";
import { WordPackSelector } from "./WordPackSelector";
import { StartButton } from "./StartButton";
import { SettingsButton } from "@/components/ui/SettingsButton";
import { MuteButton } from "@/components/ui/MuteButton";
import { audioManager } from "@/game/audio/AudioManager";
import { useEffect } from "react";

const SceneCanvas = dynamic(() => import("@/components/three/SceneCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 -z-10 bg-[#021018]" aria-hidden />
  ),
});

export function LandingScreen() {
  useEffect(() => {
    audioManager.init();
    audioManager.playAmbient();
    return () => {
      // Keep ambient if navigating to countdown — stop only on full leave handled by AppShell
    };
  }, []);

  return (
    <main className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden">
      <div className="ocean-gradient pointer-events-none absolute inset-0 -z-20" />
      <div className="ocean-vignette pointer-events-none absolute inset-0 -z-10" />

      <SceneCanvas />

      <MuteButton className="absolute top-4 right-16 z-20 sm:top-6 sm:right-20" />
      <SettingsButton />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 flex h-full w-full max-w-6xl flex-col items-center justify-between px-4 py-10 sm:py-12 md:py-14"
      >
        <div className="flex w-full flex-col items-center pt-2 sm:pt-4">
          <LandingTitle />
        </div>

        <div className="pointer-events-none flex-1" aria-hidden />

        <div className="flex w-full flex-col items-center gap-4 pb-2 sm:gap-5 sm:pb-4">
          <GameModeSelector />
          <ArenaLayoutSelector />
          <WordPackSelector />
          <StartButton />
        </div>
      </motion.div>
    </main>
  );
}
