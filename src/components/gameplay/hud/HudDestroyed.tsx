"use client";

import { useStatsStore } from "@/game/state/useStatsStore";
import { useSmoothNumber } from "@/hooks/useSmoothNumber";
import { HudCard } from "./HudCard";

export function HudDestroyed() {
  const destroyed = useStatsStore((s) => s.enemiesDestroyed);
  const smooth = useSmoothNumber(destroyed, { speed: 10, decimals: 0 });

  return (
    <HudCard label="Destroyed" align="right">
      <span className="tabular-nums">{smooth}</span>
    </HudCard>
  );
}
