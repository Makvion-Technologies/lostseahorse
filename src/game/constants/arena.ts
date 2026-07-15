/**
 * Arena layout — seahorse position + which sides words enter from.
 * Applies to every game mode (timed, infinite, zen).
 */

import type { SpawnDirection } from "./world";

export type ArenaLayoutId = "left" | "center" | "right";

export interface ArenaLayoutDef {
  id: ArenaLayoutId;
  label: string;
  description: string;
  /** World X of the seahorse / breach target. */
  seahorseX: number;
  /** Which edges spawn words. */
  spawnSides: readonly SpawnDirection[];
}

/**
 * World X for the seahorse. Camera stays fixed on world center (0,0,0)
 * so left/right layouts actually appear at the screen edges.
 * ~±3.6 sits near the edge of the default gameplay frustum.
 */
export const ARENA_LAYOUTS: readonly ArenaLayoutDef[] = [
  {
    id: "left",
    label: "Left",
    description: "Seahorse left · words from the right",
    seahorseX: -3.55,
    spawnSides: ["right"],
  },
  {
    id: "center",
    label: "Center",
    description: "Seahorse center · words from both sides",
    seahorseX: 0,
    spawnSides: ["left", "right"],
  },
  {
    id: "right",
    label: "Right",
    description: "Seahorse right · words from the left",
    seahorseX: 3.55,
    spawnSides: ["left"],
  },
] as const;

export const DEFAULT_ARENA_LAYOUT_ID: ArenaLayoutId = "center";

export function getArenaLayout(id: ArenaLayoutId): ArenaLayoutDef {
  return ARENA_LAYOUTS.find((l) => l.id === id) ?? ARENA_LAYOUTS[1];
}

/** Seahorse / aim / breach world position for a layout. */
export function getArenaTarget(id: ArenaLayoutId): {
  x: number;
  y: number;
  z: number;
} {
  const layout = getArenaLayout(id);
  return { x: layout.seahorseX, y: 0, z: 0 };
}

export function isArenaLayoutId(value: string): value is ArenaLayoutId {
  return (
    value === "left" || value === "center" || value === "right"
  );
}
