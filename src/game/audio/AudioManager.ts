/**
 * Production AudioManager — Howler-ready architecture with Web Audio synth SFX.
 * Respects browser autoplay policy: unlocks on first user gesture.
 */

import {
  getAudioContext,
  playSynth,
  resumeAudioContext,
  type SynthKind,
} from "./synth";

export type AudioChannel =
  | "attack"
  | "explosion"
  | "damage"
  | "ambient"
  | "countdown"
  | "ui"
  | "letterHit"
  | "bubblePop"
  | "gameOver"
  | "results";

const STORAGE_KEY = "lostseahorse.audio.v1";

interface AudioPrefs {
  muted: boolean;
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
}

class AudioManager {
  private muted = false;
  private masterVolume = 0.75;
  private musicVolume = 0.55;
  private effectsVolume = 0.85;
  private initialized = false;
  private unlocked = false;
  private ambientActive = false;
  private ambientTimer: ReturnType<typeof setInterval> | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private unlockBound = false;

  /** Prepare audio graph. Safe to call multiple times. */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.loadPrefs();
    this.bindUnlockListeners();
    this.ensureGraph();
  }

  isReady(): boolean {
    return this.initialized;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  private ensureGraph(): void {
    const ctx = getAudioContext();
    if (!ctx || this.masterGain) return;

    this.masterGain = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.effectsGain = ctx.createGain();

    this.musicGain.connect(this.masterGain);
    this.effectsGain.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    this.applyGains();
  }

  private applyGains(): void {
    const m = this.muted ? 0 : 1;
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume * m;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
    if (this.effectsGain) {
      this.effectsGain.gain.value = this.effectsVolume;
    }
  }

  private bindUnlockListeners(): void {
    if (typeof window === "undefined" || this.unlockBound) return;
    this.unlockBound = true;

    const unlock = () => {
      void this.unlock();
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
  }

  /** Resume AudioContext after a user gesture (autoplay policy). */
  async unlock(): Promise<void> {
    this.init();
    this.ensureGraph();
    const ok = await resumeAudioContext();
    if (ok) {
      this.unlocked = true;
      if (this.ambientActive) this.startAmbientLoop();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGains();
    this.savePrefs();
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): void {
    this.setMuted(!this.muted);
  }

  setVolume(volume: number): void {
    this.setMasterVolume(volume);
  }

  getVolume(): number {
    return this.masterVolume;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.min(1, Math.max(0, volume));
    this.applyGains();
    this.savePrefs();
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.min(1, Math.max(0, volume));
    this.applyGains();
    this.savePrefs();
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  setEffectsVolume(volume: number): void {
    this.effectsVolume = Math.min(1, Math.max(0, volume));
    this.applyGains();
    this.savePrefs();
  }

  getEffectsVolume(): number {
    return this.effectsVolume;
  }

  private playEffect(kind: SynthKind): void {
    if (!this.initialized || this.muted) return;
    void this.unlock();
    const ctx = getAudioContext();
    if (!ctx || !this.effectsGain || ctx.state !== "running") return;
    playSynth(kind, this.effectsGain, ctx);
  }

  private playMusic(kind: SynthKind): void {
    if (!this.initialized || this.muted) return;
    void this.unlock();
    const ctx = getAudioContext();
    if (!ctx || !this.musicGain || ctx.state !== "running") return;
    playSynth(kind, this.musicGain, ctx);
  }

  playAttack(): void {
    this.playEffect("projectile");
  }

  playLetterHit(): void {
    this.playEffect("letterHit");
  }

  playWrongLetter(): void {
    this.playEffect("wrongLetter");
  }

  playBubblePop(): void {
    this.playEffect("bubblePop");
  }

  playExplosion(): void {
    this.playEffect("explosion");
  }

  playDamage(): void {
    this.playEffect("damage");
  }

  playCountdown(): void {
    this.playEffect("countdown");
  }

  /** Hover SFX disabled — kept as no-op for API stability. */
  playUiHover(): void {
    // no hover sounds
  }

  playUiClick(): void {
    this.playEffect("click");
  }

  /** Alias for generic UI clicks */
  playUi(): void {
    this.playUiClick();
  }

  playGameOver(): void {
    this.playEffect("gameOver");
  }

  playResultsReveal(): void {
    this.playEffect("results");
  }

  playAmbient(): void {
    this.ambientActive = true;
    this.init();
    void this.unlock().then(() => {
      if (this.ambientActive) this.startAmbientLoop();
    });
  }

  stopAmbient(): void {
    this.ambientActive = false;
    if (this.ambientTimer != null) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  private startAmbientLoop(): void {
    if (this.ambientTimer != null) return;
    if (!this.unlocked || this.muted) return;

    // Immediate gentle water bed
    this.playMusic("ambientWater");

    this.ambientTimer = setInterval(() => {
      if (!this.ambientActive || this.muted) return;
      this.playMusic("ambientWater");
      // Occasional bubble accents
      if (Math.random() < 0.55) {
        setTimeout(() => {
          if (this.ambientActive && !this.muted) {
            this.playMusic("ambientBubble");
          }
        }, 200 + Math.random() * 800);
      }
      if (Math.random() < 0.35) {
        setTimeout(() => {
          if (this.ambientActive && !this.muted) {
            this.playMusic("ambientBubble");
          }
        }, 900 + Math.random() * 1200);
      }
    }, 2200);
  }

  private loadPrefs(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw) as Partial<AudioPrefs>;
      if (typeof prefs.muted === "boolean") this.muted = prefs.muted;
      if (typeof prefs.masterVolume === "number") {
        this.masterVolume = prefs.masterVolume;
      }
      if (typeof prefs.musicVolume === "number") {
        this.musicVolume = prefs.musicVolume;
      }
      if (typeof prefs.effectsVolume === "number") {
        this.effectsVolume = prefs.effectsVolume;
      }
    } catch {
      // ignore
    }
  }

  private savePrefs(): void {
    if (typeof window === "undefined") return;
    try {
      const prefs: AudioPrefs = {
        muted: this.muted,
        masterVolume: this.masterVolume,
        musicVolume: this.musicVolume,
        effectsVolume: this.effectsVolume,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }

  dispose(): void {
    this.stopAmbient();
    this.initialized = false;
    this.masterGain = null;
    this.musicGain = null;
    this.effectsGain = null;
  }
}

/** Singleton used by systems and UI. */
export const audioManager = new AudioManager();
