import { SPAWN_RING_RADIUS, ZEN_EXIT_X } from "@/game/constants/world";
import { ENEMY_CONFIG } from "@/game/constants/enemies";
import { EnemyState, type EnemyWordEntity } from "@/game/types/Enemy";

export interface ArenaTarget {
  x: number;
  y: number;
  z: number;
}

function distanceToTarget(
  x: number,
  y: number,
  z: number,
  target: ArenaTarget,
): number {
  return Math.hypot(x - target.x, y - target.y, z - target.z);
}

function updateVisualMetrics(
  enemy: EnemyWordEntity,
  target: ArenaTarget,
  zen = false,
): void {
  enemy.distanceToCenter = distanceToTarget(
    enemy.position.x,
    enemy.position.y,
    enemy.position.z,
    target,
  );

  if (zen) {
    enemy.scale =
      ENEMY_CONFIG.MIN_SCALE +
      (ENEMY_CONFIG.MAX_SCALE - ENEMY_CONFIG.MIN_SCALE) * 0.55;
    enemy.opacity = Math.max(0.82, ENEMY_CONFIG.MIN_OPACITY);
    return;
  }

  const dist = enemy.distanceToCenter;
  const proximity = 1 - Math.min(1, dist / (SPAWN_RING_RADIUS * 1.15));
  const depth = enemy.depth;

  enemy.scale =
    ENEMY_CONFIG.MIN_SCALE +
    (ENEMY_CONFIG.MAX_SCALE - ENEMY_CONFIG.MIN_SCALE) *
      (0.45 * proximity + 0.55 * depth);

  enemy.opacity = Math.max(
    0.78,
    ENEMY_CONFIG.MIN_OPACITY +
      (ENEMY_CONFIG.MAX_OPACITY - ENEMY_CONFIG.MIN_OPACITY) *
        (0.45 * proximity + 0.55 * depth),
  );
}

export interface MovementUpdateResult {
  breachedIds: string[];
}

export interface MovementOptions {
  zen?: boolean;
  /** Seahorse / breach target for this layout */
  target?: ArenaTarget;
}

/**
 * Combat: approach seahorse target.
 * Zen: cross the screen past the seahorse, exit off the far edge.
 */
export class EnemyMovementSystem {
  readonly name = "EnemyMovementSystem";

  update(
    enemies: EnemyWordEntity[],
    deltaSeconds: number,
    elapsedTime: number,
    frozen = false,
    options: MovementOptions = {},
  ): MovementUpdateResult {
    void elapsedTime;
    const dt = Math.min(deltaSeconds, 0.05);
    const breachedIds: string[] = [];
    const zen = options.zen === true;
    const target = options.target ?? { x: 0, y: 0, z: 0 };

    for (let i = 0; i < enemies.length; i++) {
      const id = this.updateOne(enemies[i], dt, frozen, zen, target);
      if (id) breachedIds.push(id);
    }

    return { breachedIds };
  }

  private updateOne(
    enemy: EnemyWordEntity,
    dt: number,
    frozen: boolean,
    zen: boolean,
    target: ArenaTarget,
  ): string | null {
    enemy.visualOffset.x = 0;
    enemy.visualOffset.y = 0;
    enemy.visualOffset.z = 0;
    enemy.rotation = 0;

    if (
      enemy.state === EnemyState.COMPLETED ||
      enemy.state === EnemyState.DESTROYING ||
      enemy.state === EnemyState.BREACHING
    ) {
      enemy.velocity.x = 0;
      enemy.velocity.y = 0;
      enemy.velocity.z = 0;
      enemy.currentSpeed = 0;
      updateVisualMetrics(enemy, target, zen);
      return null;
    }

    if (enemy.state === EnemyState.DESTROYED || enemy.state === EnemyState.IDLE) {
      updateVisualMetrics(enemy, target, zen);
      return null;
    }

    if (frozen) {
      enemy.velocity.x = 0;
      enemy.velocity.y = 0;
      enemy.velocity.z = 0;
      enemy.currentSpeed = 0;
      updateVisualMetrics(enemy, target, zen);
      return null;
    }

    if (zen) {
      return this.updateZenLane(enemy, dt, target);
    }

    return this.updateCombatApproach(enemy, dt, target);
  }

  /**
   * Zen pass-through:
   * - spawned from right → sail left (exit past -ZEN_EXIT_X)
   * - spawned from left → sail right (exit past +ZEN_EXIT_X)
   * Never collides with the seahorse.
   */
  private updateZenLane(
    enemy: EnemyWordEntity,
    dt: number,
    target: ArenaTarget,
  ): string | null {
    if (enemy.state !== EnemyState.MOVING && enemy.state !== EnemyState.WAITING) {
      updateVisualMetrics(enemy, target, true);
      return null;
    }

    enemy.state = EnemyState.MOVING;
    const speed = enemy.baseSpeed;
    const dirX = enemy.spawnDirection === "right" ? -1 : 1;
    enemy.currentSpeed = speed;
    enemy.velocity.x = speed * dirX;
    enemy.velocity.y = 0;
    enemy.velocity.z = 0;

    enemy.position.x += enemy.velocity.x * dt;

    updateVisualMetrics(enemy, target, true);

    const exited =
      dirX > 0
        ? enemy.position.x >= ZEN_EXIT_X
        : enemy.position.x <= -ZEN_EXIT_X;

    if (exited) {
      enemy.state = EnemyState.BREACHING;
      enemy.isActive = false;
      enemy.velocity.x = 0;
      enemy.velocity.y = 0;
      enemy.velocity.z = 0;
      enemy.currentSpeed = 0;
      enemy.remainingText = "";
      return enemy.id;
    }

    return null;
  }

  /** Combat: fly toward the seahorse target; breach on contact. */
  private updateCombatApproach(
    enemy: EnemyWordEntity,
    dt: number,
    target: ArenaTarget,
  ): string | null {
    const dist = distanceToTarget(
      enemy.position.x,
      enemy.position.y,
      enemy.position.z,
      target,
    );
    enemy.distanceToCenter = dist;

    if (enemy.state === EnemyState.MOVING || enemy.state === EnemyState.WAITING) {
      if (dist <= ENEMY_CONFIG.WAIT_DISTANCE) {
        enemy.state = EnemyState.BREACHING;
        enemy.isActive = false;
        enemy.velocity.x = 0;
        enemy.velocity.y = 0;
        enemy.velocity.z = 0;
        enemy.currentSpeed = 0;
        updateVisualMetrics(enemy, target, false);
        return enemy.id;
      }

      enemy.state = EnemyState.MOVING;
      this.advanceTowardTarget(enemy, dist, dt, target);
    }

    updateVisualMetrics(enemy, target, false);
    return null;
  }

  private advanceTowardTarget(
    enemy: EnemyWordEntity,
    dist: number,
    dt: number,
    target: ArenaTarget,
  ): void {
    const dx = target.x - enemy.position.x;
    const dy = target.y - enemy.position.y;
    const dz = target.z - enemy.position.z;
    const inv = dist > 1e-5 ? 1 / dist : 0;

    const soft = ENEMY_CONFIG.WAIT_DISTANCE + ENEMY_CONFIG.WAIT_SOFT_ZONE;
    const ease =
      dist < soft
        ? Math.max(
            0.2,
            (dist - ENEMY_CONFIG.WAIT_DISTANCE) / ENEMY_CONFIG.WAIT_SOFT_ZONE,
          )
        : 1;

    const speed = enemy.baseSpeed * ease;
    enemy.currentSpeed = speed;

    enemy.velocity.x = dx * inv * speed;
    enemy.velocity.y = dy * inv * speed;
    enemy.velocity.z = dz * inv * speed;

    enemy.position.x += enemy.velocity.x * dt;
    enemy.position.y += enemy.velocity.y * dt;
    enemy.position.z += enemy.velocity.z * dt;
  }
}

export const enemyMovementSystem = new EnemyMovementSystem();
