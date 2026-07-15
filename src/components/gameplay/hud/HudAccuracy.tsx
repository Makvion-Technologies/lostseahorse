"use client";

import { useStatsStore } from "@/game/state/useStatsStore";
import { useSmoothNumber } from "@/hooks/useSmoothNumber";
import { HudCard } from "./HudCard";

export function HudAccuracy() {
  const accuracy = useStatsStore((s) => s.accuracy);
  const smooth = useSmoothNumber(accuracy, { speed: 5, decimals: 1 });

  return (
    <HudCard label="Accuracy" align="right">
      <span className="tabular-nums">{smooth.toFixed(1)}%</span>
    </HudCard>
  );
}
