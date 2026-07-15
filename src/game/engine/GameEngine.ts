/**
 * Placeholder game engine shell.
 * Future phases will own the tick loop, systems orchestration, and input.
 */

export interface GameEngineOptions {
  /** Target frames per second (placeholder). */
  targetFps?: number;
}

export class GameEngine {
  private running = false;
  private readonly targetFps: number;

  constructor(options: GameEngineOptions = {}) {
    this.targetFps = options.targetFps ?? 60;
  }

  /** Start the engine loop. No-op stub in Phase 2. */
  start(): void {
    this.running = true;
    // Placeholder — requestAnimationFrame loop lands later
  }

  /** Stop the engine loop. */
  stop(): void {
    this.running = false;
  }

  /** Pause without tearing down systems. */
  pause(): void {
    this.running = false;
  }

  resume(): void {
    this.running = true;
  }

  isRunning(): boolean {
    return this.running;
  }

  getTargetFps(): number {
    return this.targetFps;
  }

  /**
   * Single frame update.
   * @param _deltaSeconds time since last frame
   */
  update(_deltaSeconds: number): void {
    if (!this.running) return;
    // Placeholder — systems will be invoked here
    void _deltaSeconds;
  }

  dispose(): void {
    this.running = false;
  }
}

/** Singleton placeholder for future wiring. */
let engineInstance: GameEngine | null = null;

export function getGameEngine(): GameEngine {
  if (!engineInstance) {
    engineInstance = new GameEngine();
  }
  return engineInstance;
}

export function resetGameEngine(): void {
  engineInstance?.dispose();
  engineInstance = null;
}
