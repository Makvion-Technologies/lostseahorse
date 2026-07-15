import { create } from "zustand";
import { enemyMovementSystem } from "@/game/systems/EnemyMovementSystem";
import { typingSystem } from "@/game/systems/TypingSystem";
import { spawnSystem } from "@/game/systems/SpawnSystem";
import { getDifficulty } from "@/game/systems/DifficultySystem";
import { EnemyState, type EnemyWordEntity } from "@/game/types/Enemy";
import { useGameStore } from "@/game/state/useGameStore";
import { GAME_CONFIG } from "@/game/constants/config";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { getArenaTarget } from "@/game/constants/arena";
import { getModeById } from "@/game/constants/modes";
import { GameStatus } from "@/game/types/GameStatus";
import { statsSystem } from "@/game/systems/StatsSystem";

interface EnemyStore {
  enemies: EnemyWordEntity[];
  initialized: boolean;
  activeEnemyId: string | null;
  expectedLetter: string | null;

  initSession: () => void;
  resetEnemies: () => void;
  tick: (deltaSeconds: number, elapsedTime: number) => void;
  handleKey: (rawKey: string) => void;
  getActiveEnemy: () => EnemyWordEntity | null;
  markDestroying: (enemyId: string) => void;
  removeEnemy: (enemyId: string) => void;
}

function syncGameTypingFields(
  enemies: EnemyWordEntity[],
  activeId: string | null,
  extras?: { correctDelta?: number; incorrectDelta?: number },
): void {
  const active = enemies.find((e) => e.id === activeId) ?? null;
  useGameStore.setState((s) => ({
    activeWordId: activeId,
    currentWord: active?.originalText ?? null,
    correctCharacters: s.correctCharacters + (extras?.correctDelta ?? 0),
    incorrectKeystrokes: s.incorrectKeystrokes + (extras?.incorrectDelta ?? 0),
    activeEnemyCount: enemies.filter(
      (e) =>
        e.state === EnemyState.MOVING ||
        e.state === EnemyState.WAITING ||
        e.state === EnemyState.BREACHING,
    ).length,
  }));
}

/**
 * Handle words that left play (breach or zen off-screen exit).
 * Zen: no seahorse hit VFX, no damage — word is fully finished & removed from queue.
 */
function processBreaches(
  enemies: EnemyWordEntity[],
  breachedIds: string[],
  zen: boolean,
): void {
  if (breachedIds.length === 0) return;
  const game = useGameStore.getState();
  const exitSet = new Set(breachedIds);

  for (const enemy of enemies) {
    if (!exitSet.has(enemy.id)) continue;

    if (!zen) {
      if (enemy.state !== EnemyState.BREACHING) continue;
      const target = getArenaTarget(game.selectedArenaLayout);
      combatRuntime.onEnemyBreach({
        x: target.x,
        y: target.y,
        z: target.z,
      });
      game.takeDamage(GAME_CONFIG.DAMAGE_PER_MISS);
    }

    useGameStore.setState((s) => ({
      wordsMissed: s.wordsMissed + 1,
    }));
    statsSystem.onWordMissed();

    // Fully retire — never keep blocking the typing FIFO
    enemy.state = EnemyState.DESTROYING;
    enemy.isActive = false;
    enemy.remainingText = "";
    enemy.typedCharacters = enemy.originalText;
  }
}

export const useEnemyStore = create<EnemyStore>((set, get) => ({
  enemies: [],
  initialized: false,
  activeEnemyId: null,
  expectedLetter: null,

  initSession: () => {
    if (get().initialized && get().enemies.length > 0) return;

    spawnSystem.init();
    const game = useGameStore.getState();
    const layout = game.selectedArenaLayout;
    const target = getArenaTarget(layout);
    const elapsed = game.elapsedPlayTime;
    const diff = getDifficulty(elapsed);
    const enemies = spawnSystem.fillInitial([], diff, layout, target.x);
    const activeId = typingSystem.ensureActiveEnemy(enemies);
    const active = enemies.find((e) => e.id === activeId) ?? null;

    set({
      enemies,
      initialized: true,
      activeEnemyId: activeId,
      expectedLetter: active?.remainingText[0] ?? null,
    });
    syncGameTypingFields(enemies, activeId);
    useGameStore.getState().setDifficultyDebug({
      difficultyMultiplier: diff.multiplier,
      spawnRate: 1 / diff.spawnInterval,
      activeEnemyCount: spawnSystem.countLiving(enemies),
    });
  },

  resetEnemies: () => {
    spawnSystem.dispose();
    set({
      enemies: [],
      initialized: false,
      activeEnemyId: null,
      expectedLetter: null,
    });
  },

  tick: (deltaSeconds, elapsedTime) => {
    const game = useGameStore.getState();
    const zen = getModeById(game.selectedMode).id === "zen";
    const layout = game.selectedArenaLayout;
    const target = getArenaTarget(layout);
    const frozen =
      game.systemsFrozen || game.gameStatus === GameStatus.GAME_OVER;
    let { enemies } = get();

    // Elapsed play + mode timer
    if (!frozen && game.gameStatus === GameStatus.PLAYING) {
      game.tickPlayTime(deltaSeconds);
      game.updateTimer(deltaSeconds);
    }

    const elapsed = useGameStore.getState().elapsedPlayTime;
    const diff = getDifficulty(elapsed);

    // Movement: combat → seahorse; zen → pass-through past seahorse
    const { breachedIds } = enemyMovementSystem.update(
      enemies,
      deltaSeconds,
      elapsedTime,
      frozen,
      { zen, target },
    );

    if (breachedIds.length > 0 && !frozen) {
      processBreaches(enemies, breachedIds, zen);
    }

    // Immediately drop exited / breached words so they never block the FIFO queue
    if (breachedIds.length > 0) {
      const gone = new Set(breachedIds);
      enemies = enemies.filter((e) => !gone.has(e.id));
    }

    // Continuous spawn — sides depend on arena layout
    if (!frozen && game.gameStatus === GameStatus.PLAYING) {
      const spawned = spawnSystem.trySpawn(
        enemies,
        diff,
        deltaSeconds,
        frozen,
        layout,
        target.x,
      );
      if (spawned) enemies = [...enemies, spawned];

      if (spawnSystem.countLiving(enemies) === 0) {
        const emergency = spawnSystem.trySpawn(
          enemies,
          diff,
          999,
          false,
          layout,
          target.x,
        );
        if (emergency) enemies = [...enemies, emergency];
      }
    }

    // Cleanup DESTROYING breach leftovers already handled; combat removeEnemy for typed

    const activeId = frozen
      ? get().activeEnemyId
      : typingSystem.ensureActiveEnemy(enemies);
    const active = enemies.find((e) => e.id === activeId) ?? null;

    set({
      enemies: enemies.slice(),
      activeEnemyId: activeId,
      expectedLetter: active?.remainingText[0] ?? null,
    });

    useGameStore.getState().setDifficultyDebug({
      difficultyMultiplier: diff.multiplier,
      spawnRate: 1 / Math.max(0.01, diff.spawnInterval),
      activeEnemyCount: spawnSystem.countLiving(enemies),
    });

    useGameStore.setState({
      activeWordId: activeId,
      currentWord: active?.originalText ?? null,
    });
  },

  handleKey: (rawKey: string) => {
    const game = useGameStore.getState();
    if (game.systemsFrozen || game.gameStatus !== GameStatus.PLAYING) return;

    const { enemies } = get();
    if (enemies.length === 0) return;

    const result = typingSystem.processKey(enemies, rawKey);
    if (!result.handled) return;

    const active =
      enemies.find((e) => e.isActive) ??
      enemies.find((e) => e.id === result.enemyId) ??
      null;

    set({
      enemies: enemies.slice(),
      activeEnemyId: active?.id ?? result.enemyId,
      expectedLetter: active?.remainingText[0] ?? null,
    });

    if (result.correct) {
      syncGameTypingFields(enemies, active?.id ?? result.enemyId, {
        correctDelta: 1,
      });
    } else {
      syncGameTypingFields(enemies, active?.id ?? result.enemyId, {
        incorrectDelta: 1,
      });
    }
  },

  getActiveEnemy: () => {
    const { enemies, activeEnemyId } = get();
    return enemies.find((e) => e.id === activeEnemyId) ?? null;
  },

  markDestroying: (enemyId) => {
    const { enemies } = get();
    const enemy = enemies.find((e) => e.id === enemyId);
    if (!enemy) return;
    if (
      enemy.state === EnemyState.DESTROYED ||
      enemy.state === EnemyState.DESTROYING
    ) {
      return;
    }
    enemy.state = EnemyState.DESTROYING;
    enemy.isActive = false;
    enemy.velocity.x = 0;
    enemy.velocity.y = 0;
    enemy.velocity.z = 0;
    enemy.currentSpeed = 0;
    set({ enemies: enemies.slice() });
  },

  removeEnemy: (enemyId) => {
    const { enemies, activeEnemyId } = get();
    const next = enemies.filter((e) => e.id !== enemyId);
    if (next.length === enemies.length) return;

    const frozen = useGameStore.getState().systemsFrozen;
    const activeId = frozen
      ? activeEnemyId === enemyId
        ? null
        : activeEnemyId
      : activeEnemyId === enemyId
        ? typingSystem.ensureActiveEnemy(next)
        : activeEnemyId;
    const active = next.find((e) => e.id === activeId) ?? null;

    set({
      enemies: next,
      activeEnemyId: activeId,
      expectedLetter: active?.remainingText[0] ?? null,
    });
    useGameStore.setState({
      activeWordId: activeId,
      currentWord: active?.originalText ?? null,
      wordsDestroyed: useGameStore.getState().wordsDestroyed + 1,
      activeEnemyCount: spawnSystem.countLiving(next),
    });
  },
}));
