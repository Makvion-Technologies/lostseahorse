/**
 * Seahorse animation state machine with smooth cross-fading.
 * Never snaps between states — weights blend over blendDuration.
 */

export type SeahorseAnimState = "idle" | "attack" | "hurt" | "death";

interface AnimChannel {
  state: SeahorseAnimState;
  weight: number;
  /** Target weight this frame */
  target: number;
}

const BLEND_SPEED: Record<SeahorseAnimState, number> = {
  idle: 4.5,
  attack: 14,
  hurt: 12,
  death: 3.2,
};

const STATE_PRIORITY: Record<SeahorseAnimState, number> = {
  death: 4,
  hurt: 3,
  attack: 2,
  idle: 1,
};

export class SeahorseAnimationStateMachine {
  private channels: AnimChannel[] = [
    { state: "idle", weight: 1, target: 1 },
    { state: "attack", weight: 0, target: 0 },
    { state: "hurt", weight: 0, target: 0 },
    { state: "death", weight: 0, target: 0 },
  ];

  private current: SeahorseAnimState = "idle";
  private attackHold = 0;
  private hurtHold = 0;
  private dead = false;

  getCurrent(): SeahorseAnimState {
    return this.current;
  }

  isDead(): boolean {
    return this.dead;
  }

  /** Request a state transition. Death is sticky. */
  request(state: SeahorseAnimState): void {
    if (this.dead && state !== "death") return;

    if (state === "death") {
      this.dead = true;
      this.current = "death";
      this.setTargets("death");
      return;
    }

    if (state === "attack") {
      this.attackHold = 0.22;
      if (STATE_PRIORITY[this.current] <= STATE_PRIORITY.attack) {
        this.current = "attack";
        this.setTargets("attack");
      }
      return;
    }

    if (state === "hurt") {
      this.hurtHold = 0.28;
      if (STATE_PRIORITY[this.current] <= STATE_PRIORITY.hurt) {
        this.current = "hurt";
        this.setTargets("hurt");
      }
      return;
    }

    // idle — only if not holding attack/hurt
    if (this.attackHold <= 0 && this.hurtHold <= 0 && !this.dead) {
      this.current = "idle";
      this.setTargets("idle");
    }
  }

  private setTargets(active: SeahorseAnimState): void {
    for (const ch of this.channels) {
      ch.target = ch.state === active ? 1 : 0;
    }
  }

  /**
   * Advance blend weights. Call once per frame.
   * Returns normalized weights for each state (sum ≈ 1).
   */
  update(dt: number): Record<SeahorseAnimState, number> {
    const clamped = Math.min(dt, 0.05);

    if (this.attackHold > 0) this.attackHold -= clamped;
    if (this.hurtHold > 0) this.hurtHold -= clamped;

    // Auto-return to idle when holds expire
    if (!this.dead && this.attackHold <= 0 && this.hurtHold <= 0) {
      if (this.current === "attack" || this.current === "hurt") {
        this.current = "idle";
        this.setTargets("idle");
      }
    } else if (!this.dead && this.hurtHold > 0 && this.current !== "hurt") {
      // hurt can interrupt attack recovery
      if (this.current === "attack" && this.attackHold <= 0) {
        this.current = "hurt";
        this.setTargets("hurt");
      }
    }

    for (const ch of this.channels) {
      const speed = BLEND_SPEED[ch.state];
      const diff = ch.target - ch.weight;
      if (Math.abs(diff) < 0.001) {
        ch.weight = ch.target;
      } else {
        ch.weight += diff * Math.min(1, speed * clamped);
      }
    }

    // Normalize so sum is 1 (avoid zero-sum)
    let sum = 0;
    for (const ch of this.channels) sum += ch.weight;
    if (sum < 0.001) {
      return { idle: 1, attack: 0, hurt: 0, death: 0 };
    }

    const out: Record<SeahorseAnimState, number> = {
      idle: 0,
      attack: 0,
      hurt: 0,
      death: 0,
    };
    for (const ch of this.channels) {
      out[ch.state] = ch.weight / sum;
    }
    return out;
  }

  reset(): void {
    this.dead = false;
    this.current = "idle";
    this.attackHold = 0;
    this.hurtHold = 0;
    for (const ch of this.channels) {
      ch.weight = ch.state === "idle" ? 1 : 0;
      ch.target = ch.weight;
    }
  }
}
