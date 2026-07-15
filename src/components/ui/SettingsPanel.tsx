"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import {
  useSettingsStore,
  type FontSize,
  type ParticleDensity,
  type UiScale,
} from "@/game/state/useSettingsStore";
import { audioManager } from "@/game/audio/AudioManager";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

function SliderRow({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <div className="flex items-center justify-between text-xs tracking-wide text-cyan-100/80">
        <span>{label}</span>
        <span className="font-mono text-[10px] text-cyan-300/70">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
      />
    </label>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm text-cyan-50/95">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-[11px] leading-snug text-cyan-200/50">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => {
          audioManager.playUiClick();
          onChange(!checked);
        }}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60",
          checked
            ? "border-cyan-300/40 bg-cyan-400/80"
            : "border-white/15 bg-white/10",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
          style={{ width: 18, height: 18 }}
        />
      </button>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const groupId = useId();
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs tracking-wide text-cyan-100/80">{label}</legend>
      <div
        className="flex flex-wrap gap-1.5"
        role="radiogroup"
        aria-labelledby={groupId}
      >
        <span id={groupId} className="sr-only">
          {label}
        </span>
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                audioManager.playUiClick();
                onChange(opt.id);
              }}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-1.5 text-xs tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60",
                selected
                  ? "border-cyan-300/50 bg-cyan-400/20 text-cyan-50"
                  : "border-white/10 bg-white/5 text-cyan-100/70 hover:bg-white/10",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Modal settings panel — audio, accessibility, particles, UI scale.
 */
export function SettingsPanel() {
  const open = useSettingsStore((s) => s.settingsOpen);
  const setOpen = useSettingsStore((s) => s.setSettingsOpen);
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const effectsVolume = useSettingsStore((s) => s.effectsVolume);
  const muted = useSettingsStore((s) => s.muted);
  const forceReducedMotion = useSettingsStore((s) => s.forceReducedMotion);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const particleDensity = useSettingsStore((s) => s.particleDensity);
  const uiScale = useSettingsStore((s) => s.uiScale);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const showDebug = useSettingsStore((s) => s.showDebug);

  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume);
  const setEffectsVolume = useSettingsStore((s) => s.setEffectsVolume);
  const setMuted = useSettingsStore((s) => s.setMuted);
  const setForceReducedMotion = useSettingsStore((s) => s.setForceReducedMotion);
  const setHighContrast = useSettingsStore((s) => s.setHighContrast);
  const setParticleDensity = useSettingsStore((s) => s.setParticleDensity);
  const setUiScale = useSettingsStore((s) => s.setUiScale);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setShowDebug = useSettingsStore((s) => s.setShowDebug);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
      // Simple focus trap
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, setOpen]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close settings backdrop"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-h-[min(90dvh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-400/20 bg-slate-950/95 p-5 shadow-[0_0_60px_-12px_rgba(34,211,238,0.35)] sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2
                  id={titleId}
                  className="font-display text-lg font-semibold tracking-wide text-cyan-50"
                >
                  Settings
                </h2>
                <p className="mt-1 text-[11px] text-cyan-200/50">
                  Preferences are saved on this device.
                </p>
              </div>
              <Button
                ref={closeBtnRef}
                variant="icon"
                className="!absolute !right-3 !top-3 h-9 w-9 !p-0"
                aria-label="Close settings"
                onClick={() => {
                  audioManager.playUiClick();
                  setOpen(false);
                }}
              >
                <span aria-hidden className="text-lg leading-none">
                  ×
                </span>
              </Button>
            </div>

            <div className="space-y-6">
              <section className="space-y-3" aria-label="Audio">
                <h3 className="text-[10px] font-semibold tracking-[0.2em] text-cyan-300/60 uppercase">
                  Audio
                </h3>
                <ToggleRow
                  id="mute-toggle"
                  label="Mute"
                  description="Silence all sound"
                  checked={muted}
                  onChange={setMuted}
                />
                <SliderRow
                  id="master-vol"
                  label="Master Volume"
                  value={masterVolume}
                  onChange={setMasterVolume}
                  disabled={muted}
                />
                <SliderRow
                  id="music-vol"
                  label="Music Volume"
                  value={musicVolume}
                  onChange={setMusicVolume}
                  disabled={muted}
                />
                <SliderRow
                  id="fx-vol"
                  label="Effects Volume"
                  value={effectsVolume}
                  onChange={setEffectsVolume}
                  disabled={muted}
                />
              </section>

              <section className="space-y-3" aria-label="Accessibility">
                <h3 className="text-[10px] font-semibold tracking-[0.2em] text-cyan-300/60 uppercase">
                  Accessibility
                </h3>
                <ToggleRow
                  id="reduced-motion"
                  label="Reduced Motion"
                  description="Minimize animation and camera motion"
                  checked={forceReducedMotion}
                  onChange={setForceReducedMotion}
                />
                <ToggleRow
                  id="high-contrast"
                  label="High Contrast"
                  description="Stronger text and UI contrast"
                  checked={highContrast}
                  onChange={setHighContrast}
                />
                <Segmented<UiScale>
                  label="UI Scale"
                  value={uiScale}
                  onChange={setUiScale}
                  options={[
                    { id: "sm", label: "Small" },
                    { id: "md", label: "Medium" },
                    { id: "lg", label: "Large" },
                  ]}
                />
                <Segmented<FontSize>
                  label="Font Size"
                  value={fontSize}
                  onChange={setFontSize}
                  options={[
                    { id: "sm", label: "Small" },
                    { id: "md", label: "Medium" },
                    { id: "lg", label: "Large" },
                  ]}
                />
              </section>

              <section className="space-y-3" aria-label="Graphics">
                <h3 className="text-[10px] font-semibold tracking-[0.2em] text-cyan-300/60 uppercase">
                  Graphics
                </h3>
                <Segmented<ParticleDensity>
                  label="Particle Density"
                  value={particleDensity}
                  onChange={setParticleDensity}
                  options={[
                    { id: "low", label: "Low" },
                    { id: "medium", label: "Medium" },
                    { id: "high", label: "High" },
                  ]}
                />
              </section>

              {isDev && (
                <section className="space-y-3" aria-label="Development">
                  <h3 className="text-[10px] font-semibold tracking-[0.2em] text-cyan-300/60 uppercase">
                    Development
                  </h3>
                  <ToggleRow
                    id="show-debug"
                    label="Show Debug"
                    description="Display the development debug panel"
                    checked={showDebug}
                    onChange={setShowDebug}
                  />
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
