"use client";

import { Particles } from "./Particles";
import { Bubbles } from "./Bubbles";
import { LightRays } from "./LightRays";

interface UnderwaterAtmosphereProps {
  reducedMotion?: boolean;
}

/** Composes fog, particles, bubbles, and light rays. */
export function UnderwaterAtmosphere({
  reducedMotion = false,
}: UnderwaterAtmosphereProps) {
  return (
    <>
      {/* Deep ocean fog */}
      <fog attach="fog" args={["#021018", 4, 16]} />
      <color attach="background" args={["#021018"]} />

      <Particles reducedMotion={reducedMotion} />
      <Bubbles reducedMotion={reducedMotion} />
      <LightRays reducedMotion={reducedMotion} />
    </>
  );
}
