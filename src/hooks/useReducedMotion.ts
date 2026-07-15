"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/game/state/useSettingsStore";

/**
 * Effective reduced-motion preference:
 * OS `prefers-reduced-motion` OR Settings → Reduced Motion.
 */
export function useReducedMotion(): boolean {
  const force = useSettingsStore((s) => s.forceReducedMotion);
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const matches = media.matches;
      setOsReduced(matches);
      // Keep store in sync for document dataset / non-React consumers
      const current = useSettingsStore.getState().reducedMotion;
      if (current !== matches) {
        useSettingsStore.setState({ reducedMotion: matches });
        useSettingsStore.getState().applyToDocument();
      }
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return force || osReduced;
}
