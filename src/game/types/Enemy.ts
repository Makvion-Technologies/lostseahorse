import type { SpawnDirection } from "@/game/constants/world";

/**
 * Lifecycle states for enemy words.
 * Phase 5 uses MOVING, WAITING, COMPLETED.
 */
export enum EnemyState {
  IDLE = "IDLE",
  MOVING = "MOVING",
  WAITING = "WAITING",
  /** Reached the seahorse — miss / bite sequence. */
  BREACHING = "BREACHING",
  /** Fully typed — frozen until combat phase destroys it. */
  COMPLETED = "COMPLETED",
  DESTROYING = "DESTROYING",
  DESTROYED = "DESTROYED",
}

/**
 * Living enemy-word entity.
 * Simulation systems own mutation; render components only display snapshots.
 */
export interface EnemyWordEntity {
  id: string;
  /** Full original word (never changes). */
  originalText: string;
  /** @deprecated Prefer originalText — kept as alias for display/debug. */
  text: string;
  /** Characters still to type (left → right consumption). */
  remainingText: string;
  /** Characters successfully typed (reconstructs original with remainingText). */
  typedCharacters: string;
  /** 0–1 completion ratio. */
  progress: number;
  /** progress * 100 */
  progressPercentage: number;
  remainingCharacters: number;

  /** Logical position (before visual wobble). */
  position: { x: number; y: number; z: number };
  /** Display offset applied each frame (wobble / drift). */
  visualOffset: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  /** Base yaw rotation (radians). */
  rotation: number;
  rotationSpeed: number;
  wobblePhase: number;
  wobbleAmplitude: number;
  driftPhase: number;
  /** Units per second toward center. */
  baseSpeed: number;
  currentSpeed: number;
  distanceToCenter: number;
  /**
   * Depth layer 0 (far) → 1 (near).
   * Affects scale, opacity, speed bias, blur.
   */
  depth: number;
  /** Render scale (includes distance + depth). */
  scale: number;
  opacity: number;
  state: EnemyState;
  isActive: boolean;
  spawnDirection: SpawnDirection;
  /** Spawn order for stable closest-tie breaks. */
  spawnIndex: number;
}
