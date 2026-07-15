export { GAME_CONFIG, type GameConfig } from "./config";
export {
  GAME_MODES,
  DEFAULT_MODE_ID,
  getModeById,
  type GameModeId,
  type ModeDefinition,
} from "./modes";
export {
  CENTER_TARGET,
  SPAWN_DIRECTIONS,
  SPAWN_DIRECTION_VECTORS,
  SPAWN_RING_RADIUS,
  HEALTH_CLEARANCE_RADIUS,
  GAMEPLAY_CAMERA,
  type SpawnDirection,
  type Vec3,
} from "./world";
export {
  ARENA_LAYOUTS,
  DEFAULT_ARENA_LAYOUT_ID,
  getArenaLayout,
  getArenaTarget,
  isArenaLayoutId,
  type ArenaLayoutId,
  type ArenaLayoutDef,
} from "./arena";
export {
  ENEMY_CONFIG,
  ENEMY_WAIT_DISTANCE,
  ENEMY_WAIT_SOFT_ZONE,
} from "./enemies";
export {
  PERFORMANCE_TITLE_TIERS,
  SESSION_MESSAGES,
  RESULTS_REVEAL_DELAY_MS,
  RESULTS_STAT_STAGGER_MS,
  RESULTS_COUNT_UP_MS,
  resolvePerformanceTitle,
  pickSessionMessage,
  type PerformanceTitleTier,
} from "./results";
