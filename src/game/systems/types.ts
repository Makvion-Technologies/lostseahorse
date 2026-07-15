/**
 * Shared system contract for future gameplay systems.
 * No systems are active in Phase 2.
 */

export interface GameSystem {
  readonly name: string;
  /** Called once when the engine starts a play session. */
  init?(): void;
  /** Per-frame update. */
  update(deltaSeconds: number): void;
  /** Cleanup when the session ends. */
  dispose?(): void;
}
