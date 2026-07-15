"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { GAME_CONFIG } from "@/game/constants/config";
import { GAMEPLAY_CAMERA } from "@/game/constants/world";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { useGameReducedMotion } from "@/hooks/useGameReducedMotion";
import {
  PARTICLE_DENSITY_SCALE,
  useSettingsStore,
} from "@/game/state/useSettingsStore";
import { OceanWorld } from "./OceanWorld";
import { GameplayCamera } from "./GameplayCamera";

interface GameplayCanvasProps {
  className?: string;
}

/**
 * Gameplay WebGL canvas.
 * No outer Suspense(null) — that hid the whole scene while fonts loaded.
 * No EffectComposer — it was blanking frames after context issues.
 */
export default function GameplayCanvas({ className }: GameplayCanvasProps) {
  const mouse = useMouseParallax();
  const reducedMotion = useGameReducedMotion();
  const particleDensity = useSettingsStore((s) => s.particleDensity);
  const densityScale = PARTICLE_DENSITY_SCALE[particleDensity];
  const [introProgress, setIntroProgress] = useState(
    reducedMotion ? 1 : 0,
  );
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = reducedMotionRef.current
      ? 0
      : GAME_CONFIG.GAMEPLAY_INTRO_MS;

    const tick = (now: number) => {
      const raw = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
      setIntroProgress(1 - (1 - raw) ** 3);
      if (raw < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className ?? "absolute inset-0"}
      style={{ width: "100%", height: "100%", background: "#021018" }}
    >
      <Canvas
        dpr={[1, 1.5]}
        shadows={false}
        // Critical: resize from this element so canvas is never 0×0
        style={{ width: "100%", height: "100%", display: "block" }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "default",
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{
          position: [
            GAMEPLAY_CAMERA.introPosition.x,
            GAMEPLAY_CAMERA.introPosition.y,
            GAMEPLAY_CAMERA.introPosition.z,
          ],
          fov: GAMEPLAY_CAMERA.fov,
          near: 0.1,
          far: 50,
        }}
        onCreated={({ gl, size }) => {
          gl.domElement.setAttribute("aria-hidden", "true");
          gl.setClearColor(new THREE.Color("#021018"), 1);
          gl.shadowMap.enabled = false;
          gl.domElement.style.width = "100%";
          gl.domElement.style.height = "100%";
          // Force a resize if container already has layout
          if (size.width < 2 || size.height < 2) {
            const el = containerRef.current;
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                gl.setSize(rect.width, rect.height, false);
              }
            }
          }
        }}
      >
        <OceanWorld
          reducedMotion={reducedMotion}
          introProgress={introProgress}
          particleScale={densityScale}
        />
        <GameplayCamera
          mouse={mouse}
          reducedMotion={reducedMotion}
          introProgress={introProgress}
        />
      </Canvas>
    </div>
  );
}
