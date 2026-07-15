/**
 * Sacred world-space anchors for the gameplay arena.
 * CENTER_TARGET is the default center layout; live sessions use getArenaTarget(layout).
 */

/** Default center layout focus (also used as world origin). */
export const CENTER_TARGET = {
  x: 0,
  y: 0,
  z: 0,
} as const;

export type Vec3 = { x: number; y: number; z: number };

/**
 * Words only enter from left / right sides.
 * Corners and pure top/bottom are excluded so nothing drops from the top/bottom of the screen.
 */
export const SPAWN_DIRECTIONS = ["left", "right"] as const;

export type SpawnDirection = (typeof SPAWN_DIRECTIONS)[number];

/**
 * Normalized edge directions on the spawn ring (unit vectors in X/Y).
 * Y is 0 — vertical band is applied separately as a mild mid-screen offset.
 */
export const SPAWN_DIRECTION_VECTORS: Record<
  SpawnDirection,
  { x: number; y: number }
> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Max |Y| offset from center when spawning (keeps words in mid-band). */
export const SPAWN_VERTICAL_BAND = 1.15;

/** Radius of the off-screen spawn ring (world units). */
export const SPAWN_RING_RADIUS = 7.5;

/**
 * Zen practice: finish & remove a word once |x| reaches this.
 * Tuned to the gameplay camera (~16:9, fov 40) so words leave the
 * typeable queue as soon as they leave the visible frame — not later.
 */
export const ZEN_EXIT_X = 4.75;

/**
 * Words render this far toward the camera (positive Z) so they stay
 * in front of the seahorse when crossing the center.
 */
export const WORD_DISPLAY_Z = 0.95;

/** Vertical band reserved above seahorse for health / effects (world units). */
export const HEALTH_CLEARANCE_RADIUS = 1.35;

/** Default cinematic camera rest pose (slightly above, looking at center). */
export const GAMEPLAY_CAMERA = {
  position: { x: 0, y: 0.55, z: 6.2 },
  /** Start farther for intro push-in. */
  introPosition: { x: 0, y: 0.85, z: 8.4 },
  lookAt: CENTER_TARGET,
  fov: 40,
  parallaxStrength: 0.22,
  idleOrbitStrength: 0.06,
  idleBobStrength: 0.04,
  introDurationSeconds: 2.4,
} as const;
