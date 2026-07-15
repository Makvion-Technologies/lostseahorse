/**
 * Enemy word tuning (Phase 4 — visual + movement only).
 */

/** Approximate stop distance from center (~150px at default camera framing). */
export const ENEMY_WAIT_DISTANCE = 1.55;

/** Soft arrival band so enemies ease into WAITING. */
export const ENEMY_WAIT_SOFT_ZONE = 0.35;

export const ENEMY_CONFIG = {
  WAIT_DISTANCE: ENEMY_WAIT_DISTANCE,
  WAIT_SOFT_ZONE: ENEMY_WAIT_SOFT_ZONE,

  /** Base swim speed range (world units / second). */
  MIN_SPEED: 0.28,
  MAX_SPEED: 0.48,

  /** Distance-based scale (far → near). */
  MIN_SCALE: 0.72,
  MAX_SCALE: 1.18,

  /** Opacity range by depth / distance — keep readable. */
  MIN_OPACITY: 0.78,
  MAX_OPACITY: 0.98,

  /** Wobble (disabled in movement — straight lines only). */
  WOBBLE_SPEED: 0,
  DRIFT_SPEED: 0,

  /** Active word visual boosts (render-only multipliers). */
  ACTIVE_SCALE_BOOST: 1.12,
  ACTIVE_OPACITY_BOOST: 1.08,

  /** Next-word preview (queued after current active). */
  NEXT_SCALE_BOOST: 1.06,
  NEXT_OPACITY_BOOST: 1.02,

  /** Bubble trail (per enemy, performance-friendly). */
  TRAIL_BUBBLE_COUNT: 5,
} as const;
