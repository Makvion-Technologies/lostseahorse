export interface CombatVec3 {
  x: number;
  y: number;
  z: number;
}

export interface CombatProjectile {
  id: number;
  enemyId: string;
  letter: string;
  isFinal: boolean;
  from: CombatVec3;
  to: CombatVec3;
  /** 0–1 travel progress */
  t: number;
  /** seconds for full travel */
  duration: number;
  alive: boolean;
}

export interface CombatImpact {
  id: number;
  position: CombatVec3;
  letter: string;
  age: number;
  duration: number;
  alive: boolean;
}

export interface CombatExplosion {
  id: number;
  enemyId: string;
  position: CombatVec3;
  age: number;
  duration: number;
  alive: boolean;
  /** When true, enemy should be removed from store */
  removalQueued: boolean;
}

/** Red spark burst when the player types a wrong letter on a word. */
export interface CombatWrongSpark {
  id: number;
  enemyId: string;
  position: CombatVec3;
  age: number;
  duration: number;
  alive: boolean;
  /** Stable seed for particle directions */
  seed: number;
}

export interface SeahorseCombatState {
  /** World-space aim point (active enemy). */
  aimX: number;
  aimY: number;
  aimZ: number;
  /** 0–1 how strongly to face aim */
  aimBlend: number;
  /** 0–1 mouth open */
  mouthOpen: number;
  /** Extra emissive boost 0–1 */
  glowBoost: number;
  /** Attack pulse for blend (seconds remaining of punch) */
  attackTimer: number;
}

export interface CombatDebugStats {
  projectilesAlive: number;
  activeCombatAnimations: number;
  pendingExplosions: number;
}
