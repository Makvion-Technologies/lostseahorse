"use client";

import { HealthBar } from "./HealthBar";
import { HudWpm } from "./hud/HudWpm";
import { HudCenterControls } from "./hud/HudCenterControls";
import { HudAccuracy } from "./hud/HudAccuracy";
import { HudCombo } from "./hud/HudCombo";
import { HudDestroyed } from "./hud/HudDestroyed";

/**
 * Live in-game HUD — premium glass chips, never blocking center play.
 * Top-center: time (or Zen Finish) + pause icon on one row.
 */
export function HudSlots() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-3 top-3 sm:left-5 sm:top-5 md:left-8 md:top-7">
        <HudWpm />
      </div>

      <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 sm:top-5 md:top-7">
        <HudCenterControls />
      </div>

      <div className="absolute right-3 top-3 sm:right-5 sm:top-5 md:right-8 md:top-7">
        <HudAccuracy />
      </div>

      <div className="absolute bottom-16 left-3 sm:bottom-10 sm:left-5 md:bottom-10 md:left-8">
        <HudCombo />
      </div>

      <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 sm:bottom-8">
        <HealthBar />
      </div>

      <div className="absolute bottom-16 right-3 sm:bottom-10 sm:right-5 md:bottom-10 md:right-8">
        <HudDestroyed />
      </div>
    </div>
  );
}
