import {
  CENTER_TARGET,
  SPAWN_DIRECTION_VECTORS,
  SPAWN_DIRECTIONS,
  SPAWN_RING_RADIUS,
  type SpawnDirection,
} from "@/game/constants/world";
import { ENEMY_CONFIG } from "@/game/constants/enemies";
import { EnemyState, type EnemyWordEntity } from "@/game/types/Enemy";

/**
 * Temporary hardcoded enemy roster — no spawn system yet.
 * One word per spawn edge, deterministic layout.
 */
const TEST_WORDS = [
  "ocean",
  "banana",
  "computer",
  "keyboard",
  "galaxy",
  "camera",
  "water",
  "future",
] as const;

/** Depth layers: farther / slower / dimmer → nearer / faster / brighter */
const DEPTH_BY_INDEX = [0.25, 0.55, 0.85, 0.4, 0.7, 0.95, 0.35, 0.6];

function distanceToCenter(x: number, y: number, z: number): number {
  const dx = x - CENTER_TARGET.x;
  const dy = y - CENTER_TARGET.y;
  const dz = z - CENTER_TARGET.z;
  return Math.hypot(dx, dy, dz);
}

function spawnPosition(direction: SpawnDirection, depth: number) {
  const dir = SPAWN_DIRECTION_VECTORS[direction];
  const radius = SPAWN_RING_RADIUS * (0.92 + depth * 0.08);
  return {
    x: CENTER_TARGET.x + dir.x * radius,
    y: CENTER_TARGET.y + dir.y * radius,
    z: CENTER_TARGET.z + (0.5 - depth) * 1.4,
  };
}

function createEnemy(
  index: number,
  text: string,
  direction: SpawnDirection,
): EnemyWordEntity {
  const depth = DEPTH_BY_INDEX[index] ?? 0.5;
  const position = spawnPosition(direction, depth);
  const dist = distanceToCenter(position.x, position.y, position.z);

  const speedSpan = ENEMY_CONFIG.MAX_SPEED - ENEMY_CONFIG.MIN_SPEED;
  const baseSpeed = ENEMY_CONFIG.MIN_SPEED + depth * speedSpan;

  const proximity = 1 - Math.min(1, dist / (SPAWN_RING_RADIUS * 1.15));
  const scale =
    ENEMY_CONFIG.MIN_SCALE +
    (ENEMY_CONFIG.MAX_SCALE - ENEMY_CONFIG.MIN_SCALE) *
      (0.35 * proximity + 0.65 * depth);
  const opacity =
    ENEMY_CONFIG.MIN_OPACITY +
    (ENEMY_CONFIG.MAX_OPACITY - ENEMY_CONFIG.MIN_OPACITY) *
      (0.4 * proximity + 0.6 * depth);

  const originalText = text.toLowerCase();

  return {
    id: `enemy_${index}_${originalText}`,
    originalText,
    text: originalText,
    remainingText: originalText,
    typedCharacters: "",
    progress: 0,
    progressPercentage: 0,
    remainingCharacters: originalText.length,
    position,
    visualOffset: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: (index * 0.37) % (Math.PI * 2),
    rotationSpeed: 0.12 + depth * 0.18,
    wobblePhase: index * 1.7,
    wobbleAmplitude: 0.06 + (1 - depth) * 0.04,
    driftPhase: index * 0.9,
    baseSpeed,
    currentSpeed: baseSpeed,
    distanceToCenter: dist,
    depth,
    scale,
    opacity,
    state: EnemyState.MOVING,
    isActive: false,
    spawnDirection: direction,
    spawnIndex: index,
  };
}

/** Build the test enemy set (8 words, fixed edges). Active set by TypingSystem. */
export function createTestEnemies(): EnemyWordEntity[] {
  return TEST_WORDS.map((word, index) => {
    const direction = SPAWN_DIRECTIONS[index % SPAWN_DIRECTIONS.length];
    return createEnemy(index, word, direction);
  });
}

export const TEST_ENEMY_WORDS = TEST_WORDS;
