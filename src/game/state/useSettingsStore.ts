import { create } from "zustand";
import { audioManager } from "@/game/audio/AudioManager";

const STORAGE_KEY = "lostseahorse.settings.v1";

export type ParticleDensity = "low" | "medium" | "high";
export type UiScale = "sm" | "md" | "lg";
export type FontSize = "sm" | "md" | "lg";

export interface SettingsState {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  muted: boolean;
  reducedMotion: boolean;
  /** Force reduced motion even if OS prefers motion */
  forceReducedMotion: boolean;
  highContrast: boolean;
  particleDensity: ParticleDensity;
  uiScale: UiScale;
  fontSize: FontSize;
  /** Development-only debug overlay toggle */
  showDebug: boolean;
  settingsOpen: boolean;
}

export interface SettingsActions {
  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setEffectsVolume: (v: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setForceReducedMotion: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setParticleDensity: (v: ParticleDensity) => void;
  setUiScale: (v: UiScale) => void;
  setFontSize: (v: FontSize) => void;
  setShowDebug: (v: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
  hydrateFromStorage: () => void;
  applyToDocument: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

const defaults: SettingsState = {
  masterVolume: 0.75,
  musicVolume: 0.55,
  effectsVolume: 0.85,
  muted: false,
  reducedMotion: false,
  forceReducedMotion: false,
  highContrast: false,
  particleDensity: "medium",
  uiScale: "md",
  fontSize: "md",
  /** Off by default — open Settings → Show Debug when needed (dev only). */
  showDebug: false,
  settingsOpen: false,
};

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function persist(state: SettingsState): void {
  if (typeof window === "undefined") return;
  try {
    const {
      masterVolume,
      musicVolume,
      effectsVolume,
      muted,
      forceReducedMotion,
      highContrast,
      particleDensity,
      uiScale,
      fontSize,
      showDebug,
    } = state;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        masterVolume,
        musicVolume,
        effectsVolume,
        muted,
        forceReducedMotion,
        highContrast,
        particleDensity,
        uiScale,
        fontSize,
        showDebug,
      }),
    );
  } catch {
    // Ignore quota / private mode errors
  }
}

function applyAudio(state: SettingsState): void {
  audioManager.setMuted(state.muted);
  audioManager.setMasterVolume(state.masterVolume);
  audioManager.setMusicVolume(state.musicVolume);
  audioManager.setEffectsVolume(state.effectsVolume);
}

function applyDocument(state: SettingsState): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.dataset.uiScale = state.uiScale;
  root.dataset.fontSize = state.fontSize;
  root.dataset.highContrast = state.highContrast ? "true" : "false";
  root.dataset.reducedMotion =
    state.forceReducedMotion || state.reducedMotion ? "true" : "false";

  const scaleMap: Record<UiScale, string> = {
    sm: "0.9",
    md: "1",
    lg: "1.12",
  };
  const fontMap: Record<FontSize, string> = {
    sm: "14px",
    md: "16px",
    lg: "18px",
  };
  root.style.setProperty("--ui-scale", scaleMap[state.uiScale]);
  root.style.setProperty("--app-font-size", fontMap[state.fontSize]);
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...defaults,

  setMasterVolume: (v) => {
    const masterVolume = clamp01(v);
    set({ masterVolume });
    const s = get();
    applyAudio(s);
    persist(s);
  },

  setMusicVolume: (v) => {
    const musicVolume = clamp01(v);
    set({ musicVolume });
    const s = get();
    applyAudio(s);
    persist(s);
  },

  setEffectsVolume: (v) => {
    const effectsVolume = clamp01(v);
    set({ effectsVolume });
    const s = get();
    applyAudio(s);
    persist(s);
  },

  setMuted: (muted) => {
    set({ muted });
    const s = get();
    applyAudio(s);
    persist(s);
  },

  toggleMute: () => {
    get().setMuted(!get().muted);
  },

  setForceReducedMotion: (forceReducedMotion) => {
    set({ forceReducedMotion });
    const s = get();
    applyDocument(s);
    persist(s);
  },

  setHighContrast: (highContrast) => {
    set({ highContrast });
    const s = get();
    applyDocument(s);
    persist(s);
  },

  setParticleDensity: (particleDensity) => {
    set({ particleDensity });
    persist(get());
  },

  setUiScale: (uiScale) => {
    set({ uiScale });
    const s = get();
    applyDocument(s);
    persist(s);
  },

  setFontSize: (fontSize) => {
    set({ fontSize });
    const s = get();
    applyDocument(s);
    persist(s);
  },

  setShowDebug: (showDebug) => {
    set({ showDebug });
    persist(get());
  },

  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

  hydrateFromStorage: () => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reducedMotion = media.matches;

    let loaded: Partial<SettingsState> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw) as Partial<SettingsState>;
    } catch {
      loaded = {};
    }

    set({
      ...defaults,
      ...loaded,
      reducedMotion,
      // Never force debug open — only if user saved showDebug: true
      showDebug: loaded.showDebug === true,
      settingsOpen: false,
    });

    const s = get();
    applyAudio(s);
    applyDocument(s);
    // OS reduced-motion changes are tracked by useReducedMotion hook
  },

  applyToDocument: () => applyDocument(get()),
}));

/** Effective reduced-motion flag (OS or user preference). */
export function selectEffectiveReducedMotion(s: SettingsStore): boolean {
  return s.forceReducedMotion || s.reducedMotion;
}

/** Particle / bubble count multipliers by density. */
export const PARTICLE_DENSITY_SCALE: Record<ParticleDensity, number> = {
  low: 0.45,
  medium: 1,
  high: 1.55,
};
