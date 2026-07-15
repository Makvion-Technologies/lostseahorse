"use client";

import { useMemo } from "react";
import {
  EffectComposer,
  Bloom,
  Vignette,
  HueSaturation,
  BrightnessContrast,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

interface PostProcessingProps {
  reducedMotion?: boolean;
  /** 0–1 intro / intensity scale */
  intensity?: number;
  highContrast?: boolean;
}

/**
 * Lightweight post stack — no chromatic aberration / DOF (context-loss prone).
 * Kept subtle so word text stays readable.
 */
export function PostProcessing({
  reducedMotion = false,
  intensity = 1,
  highContrast = false,
}: PostProcessingProps) {
  const i = Math.min(1, Math.max(0, intensity));

  const bloomIntensity = useMemo(() => 0.16 * i, [i]);

  if (reducedMotion) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Vignette
          offset={0.28}
          darkness={highContrast ? 0.5 : 0.4}
          blendFunction={BlendFunction.NORMAL}
        />
        <BrightnessContrast
          brightness={highContrast ? 0.04 : 0.01}
          contrast={highContrast ? 0.1 : 0.03}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.86}
        luminanceSmoothing={0.45}
        mipmapBlur
        radius={0.35}
      />
      <Vignette
        offset={0.24}
        darkness={0.34 + i * 0.08}
        blendFunction={BlendFunction.NORMAL}
      />
      <HueSaturation hue={-0.01} saturation={highContrast ? 0.05 : 0.08 * i} />
      <BrightnessContrast
        brightness={highContrast ? 0.025 : -0.01}
        contrast={highContrast ? 0.1 : 0.035 + i * 0.025}
      />
    </EffectComposer>
  );
}
