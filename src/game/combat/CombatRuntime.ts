import { getArenaTarget } from "@/game/constants/arena";
import { GAME_CONFIG } from "@/game/constants/config";
import { useEnemyStore } from "@/game/state/useEnemyStore";
import { useGameStore } from "@/game/state/useGameStore";
import type {
  CombatDebugStats,
  CombatExplosion,
  CombatImpact,
  CombatProjectile,
  CombatVec3,
  CombatWrongSpark,
  SeahorseCombatState,
} from "./types";

const MOUTH_OFFSET = { x: 0.35, y: 0.55, z: 0.08 };
const MAX_PROJECTILES = 48;
const MAX_IMPACTS = 32;
const MAX_EXPLOSIONS = 12;
const MAX_WRONG_SPARKS = 16;

function vec(x: number, y: number, z: number): CombatVec3 {
  return { x, y, z };
}

function enemyWorldPos(enemyId: string): CombatVec3 | null {
  const enemy = useEnemyStore.getState().enemies.find((e) => e.id === enemyId);
  if (!enemy) return null;
  return vec(
    enemy.position.x + enemy.visualOffset.x,
    enemy.position.y + enemy.visualOffset.y,
    enemy.position.z + enemy.visualOffset.z,
  );
}

/**
 * Mutable combat simulation — independent of React.
 * TypingSystem emits events; this visualizes them only.
 */
class CombatRuntime {
  projectiles: CombatProjectile[] = [];
  impacts: CombatImpact[] = [];
  explosions: CombatExplosion[] = [];
  wrongSparks: CombatWrongSpark[] = [];
  seahorse: SeahorseCombatState = {
    aimX: 1,
    aimY: 0,
    aimZ: 0,
    aimBlend: 0,
    mouthOpen: 0,
    glowBoost: 0,
    attackTimer: 0,
  };
  /** Camera shake amplitude (decays each frame). */
  cameraShake = 0;
  /** 0–1 game-over cinematic progress (set externally / advanced in update). */
  gameOverProgress = 0;
  gameOverActive = false;
  /** True when health hit zero (sink). False when timer ended while alive. */
  gameOverDefeated = true;
  /** Hit flash on seahorse when damaged by a breach. */
  hitFlash = 0;
  /** Brief red flash on the word that received a wrong key (enemy id). */
  wrongFlashEnemyId: string | null = null;
  wrongFlash = 0;
  private nextId = 1;
  private listeners = new Set<() => void>();
  private version = 0;

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.version += 1;
    for (const fn of this.listeners) fn();
  }

  getVersion(): number {
    return this.version;
  }

  reset(): void {
    this.projectiles = [];
    this.impacts = [];
    this.explosions = [];
    this.wrongSparks = [];
    this.cameraShake = 0;
    this.gameOverProgress = 0;
    this.gameOverActive = false;
    this.gameOverDefeated = true;
    this.hitFlash = 0;
    this.wrongFlashEnemyId = null;
    this.wrongFlash = 0;
    this.seahorse.aimBlend = 0;
    this.seahorse.mouthOpen = 0;
    this.seahorse.glowBoost = 0;
    this.seahorse.attackTimer = 0;
    this.notify();
  }

  /** Wrong key on active word — red sparkles + tiny shake. */
  onLetterIncorrect(payload: { enemyId: string }): void {
    const pos = enemyWorldPos(payload.enemyId);
    if (!pos) return;

    this.wrongFlashEnemyId = payload.enemyId;
    this.wrongFlash = 1;
    this.spawnWrongSpark(payload.enemyId, pos);
    this.cameraShake = Math.min(
      0.08,
      this.cameraShake + GAME_CONFIG.CAMERA_SHAKE_STRENGTH * 0.45,
    );
    this.notify();
  }

  /** Enemy reached seahorse — bite impact VFX. */
  onEnemyBreach(position: { x: number; y: number; z: number }): void {
    this.spawnImpact(
      { x: position.x, y: position.y, z: position.z },
      "!",
    );
    this.cameraShake = Math.min(
      0.16,
      this.cameraShake + GAME_CONFIG.CAMERA_SHAKE_STRENGTH * 1.1,
    );
    this.hitFlash = 1;
    this.notify();
  }

  /** Health damage pulse on seahorse. */
  onSeahorseHit(): void {
    this.hitFlash = 1;
    this.cameraShake = Math.min(
      0.14,
      this.cameraShake + GAME_CONFIG.CAMERA_SHAKE_STRENGTH * 0.9,
    );
  }

  beginGameOverCinematic(defeated = true): void {
    this.gameOverActive = true;
    this.gameOverDefeated = defeated;
    this.gameOverProgress = 0;
    // Soft-clear flying combat
    for (const p of this.projectiles) p.alive = false;
  }

  getDebug(): CombatDebugStats {
    return {
      projectilesAlive: this.projectiles.filter((p) => p.alive).length,
      activeCombatAnimations:
        this.impacts.filter((i) => i.alive).length +
        (this.seahorse.attackTimer > 0 ? 1 : 0) +
        (this.seahorse.mouthOpen > 0.05 ? 1 : 0),
      pendingExplosions: this.explosions.filter((e) => e.alive).length,
    };
  }

  /**
   * React to LETTER_CORRECT — never validates keys.
   */
  onLetterCorrect(payload: {
    enemyId: string;
    letter: string;
    remainingText: string;
  }): void {
    const target = enemyWorldPos(payload.enemyId);
    if (!target) return;

    const isFinal = payload.remainingText.length === 0;
    const from = this.mouthWorldPosition();
    // Aim slightly at the left edge of the word (next visible letter)
    const to = vec(target.x - 0.12, target.y + 0.02, target.z);

    this.triggerSeahorseAttack(to);
    this.spawnProjectile({
      enemyId: payload.enemyId,
      letter: payload.letter,
      isFinal,
      from,
      to,
    });

    // Tiny camera recoil per letter
    this.cameraShake = Math.min(
      0.12,
      this.cameraShake + (isFinal ? 0 : GAME_CONFIG.CAMERA_SHAKE_STRENGTH * 0.35),
    );
    this.notify();
  }

  /**
   * React to WORD_COMPLETED — ensures destruction path if final projectile missed edge cases.
   */
  onWordCompleted(payload: { enemyId: string }): void {
    const target = enemyWorldPos(payload.enemyId);
    if (!target) return;

    // If a final projectile is already in flight for this enemy, let impact handle explosion.
    const pendingFinal = this.projectiles.some(
      (p) => p.alive && p.isFinal && p.enemyId === payload.enemyId,
    );
    if (pendingFinal) return;

    // Fallback: explode at enemy now
    this.spawnExplosion(payload.enemyId, target);
    this.cameraShake = Math.min(
      0.18,
      this.cameraShake + GAME_CONFIG.CAMERA_SHAKE_STRENGTH * 1.2,
    );
    this.notify();
  }

  private mouthWorldPosition(): CombatVec3 {
    const home = getArenaTarget(useGameStore.getState().selectedArenaLayout);
    const s = this.seahorse;
    const yaw = Math.atan2(s.aimX - home.x, s.aimZ - home.z + 0.001);
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    return vec(
      home.x + MOUTH_OFFSET.x * cos + MOUTH_OFFSET.z * sin,
      home.y + MOUTH_OFFSET.y,
      home.z + MOUTH_OFFSET.x * sin + MOUTH_OFFSET.z * cos,
    );
  }

  private triggerSeahorseAttack(aim: CombatVec3): void {
    const s = this.seahorse;
    s.aimX = aim.x;
    s.aimY = aim.y;
    s.aimZ = aim.z;
    s.aimBlend = 1;
    s.mouthOpen = 1;
    s.glowBoost = 1;
    s.attackTimer = 0.18;
  }

  /** Reuse a dead pooled entry or grow the pool (bounded). */
  private acquireFromPool<T extends { alive: boolean }>(
    pool: T[],
    max: number,
    create: () => T,
  ): T {
    for (let i = 0; i < pool.length; i++) {
      if (!pool[i].alive) return pool[i];
    }
    if (pool.length >= max) {
      // Steal oldest slot
      return pool[0];
    }
    const item = create();
    pool.push(item);
    return item;
  }

  private spawnProjectile(opts: {
    enemyId: string;
    letter: string;
    isFinal: boolean;
    from: CombatVec3;
    to: CombatVec3;
  }): void {
    const dist = Math.hypot(
      opts.to.x - opts.from.x,
      opts.to.y - opts.from.y,
      opts.to.z - opts.from.z,
    );
    const baseMs = opts.isFinal
      ? GAME_CONFIG.PROJECTILE_TRAVEL_MS * 1.15
      : GAME_CONFIG.PROJECTILE_TRAVEL_MS;
    const duration = Math.max(0.06, Math.min(0.22, (baseMs / 1000) * (dist / 4)));

    const p = this.acquireFromPool(this.projectiles, MAX_PROJECTILES, () => ({
      id: this.nextId++,
      enemyId: opts.enemyId,
      letter: opts.letter,
      isFinal: opts.isFinal,
      from: { x: 0, y: 0, z: 0 },
      to: { x: 0, y: 0, z: 0 },
      t: 0,
      duration,
      alive: false,
    }));

    p.id = this.nextId++;
    p.enemyId = opts.enemyId;
    p.letter = opts.letter;
    p.isFinal = opts.isFinal;
    p.from.x = opts.from.x;
    p.from.y = opts.from.y;
    p.from.z = opts.from.z;
    p.to.x = opts.to.x;
    p.to.y = opts.to.y;
    p.to.z = opts.to.z;
    p.t = 0;
    p.duration = duration;
    p.alive = true;
  }

  private spawnImpact(position: CombatVec3, letter: string): void {
    const imp = this.acquireFromPool(this.impacts, MAX_IMPACTS, () => ({
      id: this.nextId++,
      position: { x: 0, y: 0, z: 0 },
      letter: "",
      age: 0,
      duration: 0.45,
      alive: false,
    }));

    imp.id = this.nextId++;
    imp.position.x = position.x;
    imp.position.y = position.y;
    imp.position.z = position.z;
    imp.letter = letter;
    imp.age = 0;
    imp.duration = 0.45;
    imp.alive = true;
  }

  private spawnWrongSpark(enemyId: string, position: CombatVec3): void {
    const spark = this.acquireFromPool(
      this.wrongSparks,
      MAX_WRONG_SPARKS,
      () => ({
        id: this.nextId++,
        enemyId: "",
        position: { x: 0, y: 0, z: 0 },
        age: 0,
        duration: 0.42,
        alive: false,
        seed: 0,
      }),
    );

    spark.id = this.nextId++;
    spark.enemyId = enemyId;
    spark.position.x = position.x;
    spark.position.y = position.y;
    spark.position.z = position.z;
    spark.age = 0;
    spark.duration = 0.42;
    spark.alive = true;
    spark.seed = (spark.id * 9973) % 10000;
  }

  private spawnExplosion(enemyId: string, position: CombatVec3): void {
    // Mark enemy destroying for fade animation
    useEnemyStore.getState().markDestroying(enemyId);

    const ex = this.acquireFromPool(this.explosions, MAX_EXPLOSIONS, () => ({
      id: this.nextId++,
      enemyId: "",
      position: { x: 0, y: 0, z: 0 },
      age: 0,
      duration: GAME_CONFIG.WORD_EXPLOSION_MS / 1000,
      alive: false,
      removalQueued: false,
    }));

    ex.id = this.nextId++;
    ex.enemyId = enemyId;
    ex.position.x = position.x;
    ex.position.y = position.y;
    ex.position.z = position.z;
    ex.age = 0;
    ex.duration = GAME_CONFIG.WORD_EXPLOSION_MS / 1000;
    ex.alive = true;
    ex.removalQueued = false;
  }

  /**
   * Advance combat simulation (call once per frame from CombatLayer).
   * Does not notify React every frame — only when letter debris list changes.
   */
  update(dt: number): void {
    const clamped = Math.min(dt, 0.05);
    let debrisChanged = false;

    // Seahorse attack recovery (read by Seahorse useFrame — no React needed)
    const s = this.seahorse;
    if (s.attackTimer > 0) {
      s.attackTimer = Math.max(0, s.attackTimer - clamped);
    }
    s.mouthOpen = Math.max(0, s.mouthOpen - clamped * 6.5);
    s.glowBoost = Math.max(0, s.glowBoost - clamped * 5); // ~200ms fade
    s.aimBlend = Math.max(0, s.aimBlend - clamped * 1.8);
    this.hitFlash = Math.max(0, this.hitFlash - clamped * 3.5);
    this.wrongFlash = Math.max(0, this.wrongFlash - clamped * 4.5);
    if (this.wrongFlash <= 0.02) {
      this.wrongFlashEnemyId = null;
      this.wrongFlash = 0;
    }

    if (this.gameOverActive) {
      this.gameOverProgress = Math.min(1, this.gameOverProgress + clamped / 2.6);
      // Fade combat particles
      for (const p of this.projectiles) {
        p.alive = false;
      }
      for (const w of this.wrongSparks) {
        w.alive = false;
      }
    }

    // Camera shake decay
    if (this.cameraShake > 0.0005) {
      this.cameraShake *= Math.pow(0.001, clamped);
      if (this.cameraShake < 0.0005) this.cameraShake = 0;
    }

    // Projectiles
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.t += clamped / p.duration;
      if (p.t >= 1) {
        p.t = 1;
        p.alive = false;
        this.onProjectileHit(p);
        debrisChanged = true;
      }
    }

    // Impacts
    for (const imp of this.impacts) {
      if (!imp.alive) continue;
      imp.age += clamped;
      if (imp.age >= imp.duration) {
        imp.alive = false;
        debrisChanged = true;
      }
    }

    // Wrong-letter red sparks
    for (const w of this.wrongSparks) {
      if (!w.alive) continue;
      w.age += clamped;
      // Track word as it moves
      const live = enemyWorldPos(w.enemyId);
      if (live) {
        w.position.x = live.x;
        w.position.y = live.y;
        w.position.z = live.z;
      }
      if (w.age >= w.duration) {
        w.alive = false;
        debrisChanged = true;
      }
    }

    // Explosions + delayed enemy removal
    for (const ex of this.explosions) {
      if (!ex.alive) continue;
      ex.age += clamped;
      if (!ex.removalQueued && ex.age >= ex.duration * 0.55) {
        ex.removalQueued = true;
        useEnemyStore.getState().removeEnemy(ex.enemyId);
      }
      if (ex.age >= ex.duration) {
        ex.alive = false;
      }
    }

    // Keep pools bounded — do not reallocate every frame (reuse dead slots)
    if (this.projectiles.length > MAX_PROJECTILES) {
      this.projectiles.length = MAX_PROJECTILES;
    }
    if (this.impacts.length > MAX_IMPACTS) {
      this.impacts.length = MAX_IMPACTS;
    }
    if (this.explosions.length > MAX_EXPLOSIONS) {
      this.explosions.length = MAX_EXPLOSIONS;
    }
    if (this.wrongSparks.length > MAX_WRONG_SPARKS) {
      this.wrongSparks.length = MAX_WRONG_SPARKS;
    }

    if (debrisChanged) this.notify();
  }

  private onProjectileHit(p: CombatProjectile): void {
    const hitPos = { ...p.to };

    if (p.isFinal) {
      this.spawnExplosion(p.enemyId, hitPos);
      this.cameraShake = Math.min(
        0.2,
        this.cameraShake + GAME_CONFIG.CAMERA_SHAKE_STRENGTH * 1.4,
      );
    } else {
      this.spawnImpact(hitPos, p.letter);
      this.cameraShake = Math.min(
        0.1,
        this.cameraShake + GAME_CONFIG.CAMERA_SHAKE_STRENGTH * 0.25,
      );
    }
  }

  /** Sample projectile world position for rendering. */
  projectilePosition(p: CombatProjectile): CombatVec3 {
    const e = 1 - (1 - Math.min(1, p.t)) ** 2; // ease-out
    return vec(
      p.from.x + (p.to.x - p.from.x) * e,
      p.from.y + (p.to.y - p.from.y) * e + Math.sin(e * Math.PI) * 0.08,
      p.from.z + (p.to.z - p.from.z) * e,
    );
  }
}

export const combatRuntime = new CombatRuntime();
