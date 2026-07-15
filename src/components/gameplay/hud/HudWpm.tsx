"use client";

import { useStatsStore } from "@/game/state/useStatsStore";
import { useSmoothNumber } from "@/hooks/useSmoothNumber";
import { HudCard } from "./HudCard";

export function HudWpm() {
  const displayWpm = useStatsStore((s) => s.displayWpm);
  const smooth = useSmoothNumber(displayWpm, { speed: 6, decimals: 0 });

  return (
    <HudCard label="WPM" align="left">
      <span className="tabular-nums text-cyan-50">{smooth}</span>
    </HudCard>
  );
}
