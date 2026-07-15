/**
 * Runtime representation of a swimming word.
 * Spawning and movement are implemented in later phases.
 */
export interface Word {
  id: string;
  text: string;
  remainingText: string;
  /** World / screen position (placeholder units). */
  position: { x: number; y: number; z: number };
  /** Movement vector toward the seahorse. */
  velocity: { x: number; y: number; z: number };
  rotation: number;
  spawnTime: number;
  distanceToCenter: number;
  isActive: boolean;
  isDestroyed: boolean;
  /** Typing progress 0–1 (placeholder). */
  progress: number;
}
