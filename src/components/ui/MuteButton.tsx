"use client";

import { useSettingsStore } from "@/game/state/useSettingsStore";
import { audioManager } from "@/game/audio/AudioManager";
import { Button } from "./Button";
import { cn } from "@/utils/cn";

interface MuteButtonProps {
  className?: string;
}

export function MuteButton({ className }: MuteButtonProps) {
  const muted = useSettingsStore((s) => s.muted);
  const toggleMute = useSettingsStore((s) => s.toggleMute);

  return (
    <Button
      variant="icon"
      className={cn(className)}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      aria-pressed={muted}
      title={muted ? "Unmute" : "Mute"}
      onClick={() => {
        toggleMute();
        if (muted) {
          // Unmuting — play confirmation click
          void audioManager.unlock();
          audioManager.playUiClick();
        }
      }}
    >
      {muted ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53L6.75 15H4.5a.75.75 0 0 1-.75-.75v-4.5A.75.75 0 0 1 4.5 9h2.25Z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53L6.75 15.75H4.5a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 .75-.75h2.25Z"
          />
        </svg>
      )}
    </Button>
  );
}
