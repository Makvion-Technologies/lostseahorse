# LostSeahorse

A beautiful browser game where typing keeps a lonely seahorse alive.

## Status

**Phase 10 — Production Quality** complete. Gameplay loop, typing engine, and statistics are unchanged; presentation, audio, accessibility, and performance are release-ready.

## Features

- Underwater 3D arena with seahorse combat animations (idle / attack / hurt / death)
- Procedural audio (ambient water, combat SFX, UI) with mute + volume controls
- Subtle post-processing (bloom, vignette, color grade, shimmer)
- Settings panel (audio, reduced motion, high contrast, particle density, UI scale)
- Multiple local word packs (General, Programming, Space, Animals, Countries, Technology)
- PWA-friendly metadata, manifest, favicon, Open Graph image, loading screen

### Optional GLB seahorse

Drop a model at `public/models/seahorse.glb` with animation clips named `idle`, `attack`, `hurt`, and `death`. The game loads it automatically; otherwise a polished procedural seahorse is used.

## Stack

- Next.js (App Router) · React · TypeScript · Tailwind CSS
- React Three Fiber · Three.js · `@react-three/postprocessing`
- Framer Motion · Zustand · Web Audio (Howler-ready AudioManager)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Keyboard shortcuts

| Key | Context | Action |
| --- | --- | --- |
| Letters | Playing | Type to destroy words |
| `Esc` | Playing / Paused | Pause / Resume |
| `Esc` | Settings open | Close settings |
| `R` | Paused | Restart round |
| `M` | Landing / Paused / Results | Mute toggle |

In development, enable **Show Debug** in Settings for the bottom-left debug panel.

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Development server       |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | ESLint                   |

## Project structure

```
src/
  app/                    # Next.js App Router (metadata, manifest, OG)
  components/
    landing/              # Landing + word pack selector
    ui/                   # Settings, mute, buttons, loading screen
    three/                # Landing R3F atmosphere
    scenes/               # AppShell + scene router
    gameplay/             # HUD, overlays, ocean world
      three/seahorse/     # Animation state machine + models
    providers/            # Client bootstrap + settings hydrate
    debug/                # Dev-only debug panel
  data/packs/             # Local JSON word packs
  game/
    audio/                # AudioManager + Web Audio synth
    combat/               # Pooled projectiles / impacts / explosions
    systems/              # Spawn, typing, combat, stats, difficulty
    state/                # Game + settings Zustand stores
  hooks/                  # Typing, shortcuts, reduced motion
```
