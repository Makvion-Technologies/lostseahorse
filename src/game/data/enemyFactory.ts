import {
  SPAWN_DIRECTION_VECTORS,
  SPAWN_RING_RADIUS,
  SPAWN_VERTICAL_BAND,
  WORD_DISPLAY_Z,
  type SpawnDirection,
} from "@/game/constants/world";
import { ENEMY_CONFIG } from "@/game/constants/enemies";
import { GAME_CONFIG } from "@/game/constants/config";
import { EnemyState, type EnemyWordEntity } from "@/game/types/Enemy";

export interface CreateEnemyOptions {
  text: string;
  direction: SpawnDirection;
  depth: number;
  spawnIndex: number;
  speedMul?: number;
  radiusScale?: number;
  verticalLane?: number;
  /** Seahorse world X for distance metrics */
  targetX?: number;
}

function distanceToTarget(
  x: number,
  y: number,
  z: number,
  targetX: number,
): number {
  return Math.hypot(x - targetX, y - 0, z - 0);
}

export function createEnemyEntity(opts: CreateEnemyOptions): EnemyWordEntity {
  const depth = Math.min(1, Math.max(0, opts.depth));
  const dir = SPAWN_DIRECTION_VECTORS[opts.direction];
  const radiusScale = opts.radiusScale ?? 1;
  const baseRadius = SPAWN_RING_RADIUS * (0.9 + depth * 0.1) * radiusScale;
  const radius = Math.min(
    GAME_CONFIG.MAXIMUM_SPAWN_DISTANCE,
    Math.max(GAME_CONFIG.MINIMUM_SPAWN_DISTANCE, baseRadius),
  );

  const lane = Math.max(-1, Math.min(1, opts.verticalLane ?? 0));
  const yOffset = lane * SPAWN_VERTICAL_BAND;
  const targetX = opts.targetX ?? 0;

  // World-edge spawn (not relative to seahorse) so left/right layouts stay clear
  const position = {
    x: dir.x * radius,
    y: yOffset,
    z: WORD_DISPLAY_Z,
  };

  const dist = distanceToTarget(position.x, position.y, position.z, targetX);
  const speedSpan = ENEMY_CONFIG.MAX_SPEED - ENEMY_CONFIG.MIN_SPEED;
  const speedMul = opts.speedMul ?? 1;
  const baseSpeed = Math.min(
    GAME_CONFIG.MAX_WORD_SPEED,
    Math.max(
      GAME_CONFIG.MIN_WORD_SPEED,
      (ENEMY_CONFIG.MIN_SPEED + depth * speedSpan) * speedMul,
    ),
  );

  const proximity = 1 - Math.min(1, dist / (SPAWN_RING_RADIUS * 1.15));
  const scale =
    ENEMY_CONFIG.MIN_SCALE +
    (ENEMY_CONFIG.MAX_SCALE - ENEMY_CONFIG.MIN_SCALE) *
      (0.35 * proximity + 0.65 * depth);
  const opacity =
    ENEMY_CONFIG.MIN_OPACITY +
    (ENEMY_CONFIG.MAX_OPACITY - ENEMY_CONFIG.MIN_OPACITY) *
      (0.5 * proximity + 0.5 * depth);

  const originalText = opts.text.toLowerCase().replace(/[^a-z]/g, "");
  const safeText = originalText.length > 0 ? originalText : "wave";

  return {
    id: `enemy_${opts.spawnIndex}_${safeText}`,
    originalText: safeText,
    text: safeText,
    remainingText: safeText,
    typedCharacters: "",
    progress: 0,
    progressPercentage: 0,
    remainingCharacters: safeText.length,
    position,
    visualOffset: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: 0,
    rotationSpeed: 0,
    wobblePhase: 0,
    wobbleAmplitude: 0,
    driftPhase: 0,
    baseSpeed,
    currentSpeed: baseSpeed,
    distanceToCenter: dist,
    depth,
    scale,
    opacity: Math.max(0.75, opacity),
    state: EnemyState.MOVING,
    isActive: false,
    spawnDirection: opts.direction,
    spawnIndex: opts.spawnIndex,
  };
}
