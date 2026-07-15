import { SPAWN_DIRECTIONS, type SpawnDirection } from "@/game/constants/world";
import {
  getArenaLayout,
  type ArenaLayoutId,
} from "@/game/constants/arena";
import { GAME_CONFIG } from "@/game/constants/config";
import { createEnemyEntity } from "@/game/data/enemyFactory";
import {
  DEFAULT_WORD_PACK_ID,
  getWordPool,
  type WordPackId,
} from "@/game/data/wordPacks";
import { EnemyState, type EnemyWordEntity } from "@/game/types/Enemy";
import type { DifficultySnapshot } from "./DifficultySystem";
import type { GameSystem } from "./types";

/** Development seed words always available in the pool. */
export const DEV_TEST_WORDS = [
  "ocean",
  "banana",
  "computer",
  "keyboard",
  "galaxy",
  "camera",
  "water",
  "future",
] as const;

export class SpawnSystem implements GameSystem {
  readonly name = "SpawnSystem";
  private spawnCounter = 0;
  private spawnCooldown = 0;
  private rngState = 123456789;
  private wordPool: string[] = getWordPool(DEFAULT_WORD_PACK_ID);
  private wordPackId: WordPackId = DEFAULT_WORD_PACK_ID;

  setWordPack(id: WordPackId): void {
    this.wordPackId = id;
    this.wordPool = getWordPool(id);
    if (this.wordPool.length === 0) {
      this.wordPool = [...DEV_TEST_WORDS];
    }
  }

  getWordPackId(): WordPackId {
    return this.wordPackId;
  }

  init(): void {
    this.spawnCounter = 0;
    this.spawnCooldown = 0;
    this.rngState = (Date.now() % 1000000) + 1;
    if (this.wordPool.length === 0) {
      this.wordPool = getWordPool(this.wordPackId);
    }
  }

  dispose(): void {
    this.spawnCounter = 0;
    this.spawnCooldown = 0;
  }

  update(_deltaSeconds: number): void {
    void _deltaSeconds;
  }

  private random(): number {
    let t = (this.rngState += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  private pickDirection(sides: readonly SpawnDirection[]): SpawnDirection {
    if (sides.length === 0) return "left";
    const i = Math.floor(this.random() * sides.length);
    return sides[i] ?? sides[0] ?? "left";
  }

  private pickWord(diff: DifficultySnapshot): string {
    const min = diff.wordLengthMin;
    const max = diff.wordLengthMax;
    const candidates = this.wordPool.filter(
      (w) => w.length >= min && w.length <= max,
    );
    const pool = candidates.length > 0 ? candidates : this.wordPool;
    const idx = Math.floor(this.random() * pool.length);
    return pool[idx] ?? DEV_TEST_WORDS[0];
  }

  private isTooClose(
    x: number,
    y: number,
    z: number,
    enemies: EnemyWordEntity[],
  ): boolean {
    const min = GAME_CONFIG.MIN_ENEMY_SPACING;
    for (const e of enemies) {
      if (
        e.state === EnemyState.DESTROYED ||
        e.state === EnemyState.DESTROYING
      ) {
        continue;
      }
      const d = Math.hypot(
        e.position.x - x,
        e.position.y - y,
        e.position.z - z,
      );
      if (d < min) return true;
    }
    return false;
  }

  countLiving(enemies: EnemyWordEntity[]): number {
    return enemies.filter(
      (e) =>
        e.state === EnemyState.MOVING ||
        e.state === EnemyState.WAITING ||
        e.state === EnemyState.BREACHING,
    ).length;
  }

  /**
   * @param arenaLayout — controls which sides spawn words
   * @param targetX — seahorse X (distance metrics)
   */
  trySpawn(
    enemies: EnemyWordEntity[],
    diff: DifficultySnapshot,
    deltaSeconds: number,
    frozen: boolean,
    arenaLayout: ArenaLayoutId = "center",
    targetX = 0,
  ): EnemyWordEntity | null {
    if (frozen) return null;

    this.spawnCooldown -= deltaSeconds;
    const living = this.countLiving(enemies);
    if (living >= diff.targetActive) return null;
    if (this.spawnCooldown > 0) return null;

    const sides = getArenaLayout(arenaLayout).spawnSides;

    for (let attempt = 0; attempt < 8; attempt++) {
      const direction = this.pickDirection(sides);
      const depth = 0.35 + this.random() * 0.5;
      const radiusScale = 0.94 + this.random() * 0.1;
      const verticalLane = (this.random() * 2 - 1) * 0.85;
      const text = this.pickWord(diff);
      const enemy = createEnemyEntity({
        text,
        direction,
        depth,
        spawnIndex: this.spawnCounter++,
        speedMul: diff.speedMul * (0.92 + this.random() * 0.16),
        radiusScale,
        verticalLane,
        targetX,
      });

      if (
        !this.isTooClose(
          enemy.position.x,
          enemy.position.y,
          enemy.position.z,
          enemies,
        )
      ) {
        this.spawnCooldown = diff.spawnInterval;
        return enemy;
      }
    }

    this.spawnCooldown = Math.min(0.35, diff.spawnInterval * 0.4);
    return null;
  }

  fillInitial(
    enemies: EnemyWordEntity[],
    diff: DifficultySnapshot,
    arenaLayout: ArenaLayoutId = "center",
    targetX = 0,
  ): EnemyWordEntity[] {
    const next = enemies.slice();
    let guard = 0;
    while (this.countLiving(next) < diff.targetActive && guard < 40) {
      const spawned = this.trySpawn(
        next,
        diff,
        999,
        false,
        arenaLayout,
        targetX,
      );
      if (spawned) next.push(spawned);
      else break;
      guard += 1;
    }
    if (next.length === 0) {
      const sides = getArenaLayout(arenaLayout).spawnSides;
      const forced = createEnemyEntity({
        text: DEV_TEST_WORDS[0],
        direction: sides[0] ?? "left",
        depth: 0.5,
        spawnIndex: this.spawnCounter++,
        speedMul: 1,
        targetX,
      });
      next.push(forced);
    }
    this.spawnCooldown = diff.spawnInterval * 0.5;
    return next;
  }
}

export const spawnSystem = new SpawnSystem();
