/**
 * Central game configuration.
 * Values are tuned for continuous playable loop (Phase 7).
 */

export const GAME_CONFIG = {
  /** Health (0–100 bar, not hearts) */
  DEFAULT_HEALTH: 100,
  MAXIMUM_HEALTH: 100,
  /** Damage applied when an enemy reaches the seahorse. */
  DAMAGE_PER_MISS: 12,

  /** Session / flow */
  COUNTDOWN_DURATION_SECONDS: 3,
  COUNTDOWN_LABEL: "Protect the Seahorse",

  /** Spawning */
  BASE_ACTIVE_ENEMIES: 5,
  MAX_ACTIVE_ENEMIES: 12,
  /** Seconds between spawn attempts at difficulty 1. */
  BASE_SPAWN_INTERVAL: 1.85,
  MIN_SPAWN_INTERVAL: 0.55,
  /** World-space minimum separation between enemies. */
  MIN_ENEMY_SPACING: 1.35,
  MINIMUM_SPAWN_DISTANCE: 6.2,
  MAXIMUM_SPAWN_DISTANCE: 8.4,
  BASE_WORD_LENGTH_MIN: 3,
  BASE_WORD_LENGTH_MAX: 7,

  /** Movement */
  WORD_SPEED: 0.35,
  MIN_WORD_SPEED: 0.26,
  MAX_WORD_SPEED: 0.72,

  /** Difficulty: continuous growth over elapsed play seconds */
  /** difficultyMultiplier ≈ 1 + elapsed / DIFFICULTY_RAMP_SECONDS */
  DIFFICULTY_RAMP_SECONDS: 100,
  /** Caps for smooth asymptotic feel */
  MAX_DIFFICULTY_MULTIPLIER: 2.6,

  /** Combat / feedback */
  PROJECTILE_SPEED: 18,
  LETTER_ATTACK_DURATION_MS: 150,
  PROJECTILE_TRAVEL_MS: 100,
  WORD_EXPLOSION_MS: 500,
  DAMAGE_ANIMATION_MS: 250,
  /** Cinematic length before results can fully settle */
  GAME_OVER_FADE_MS: 2400,
  BREACH_REMOVE_MS: 320,

  /** Camera */
  CAMERA_SHAKE_STRENGTH: 0.04,
  CAMERA_PARALLAX_STRENGTH: 0.22,
  GAME_OVER_CAMERA_PULL: 2.4,

  /** Particles / atmosphere */
  PARTICLE_COUNT: 90,
  BUBBLE_COUNT: 22,
  EXPLOSION_PARTICLE_COUNT: 24,
  GAMEPLAY_PARTICLE_COUNT: 80,
  GAMEPLAY_BUBBLE_COUNT: 20,

  /** Scene intro */
  GAMEPLAY_INTRO_MS: 2400,

  /** Scoring shells (not calculated yet) */
  COMBO_VISUAL_TIERS: [10, 25, 50, 100] as const,

  /** Performance targets */
  TARGET_FPS: 60,
} as const;

export type GameConfig = typeof GAME_CONFIG;
