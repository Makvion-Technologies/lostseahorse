"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CausticsProps {
  reducedMotion?: boolean;
  intensity?: number;
}

/**
 * Soft animated caustic-like light on a ground plane (fake volumetric water light).
 */
export function Caustics({
  reducedMotion = false,
  intensity = 1,
}: CausticsProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  if (!matRef.current) {
    matRef.current = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;

        float caustic(vec2 p) {
          float t = uTime * 0.15;
          float c = 0.0;
          c += sin(p.x * 8.0 + t) * sin(p.y * 7.0 - t * 1.1);
          c += sin(p.x * 12.0 - t * 0.8 + p.y * 4.0) * 0.5;
          c += sin((p.x + p.y) * 10.0 + t * 1.3) * 0.35;
          return c * 0.5 + 0.5;
        }

        void main() {
          vec2 uv = vUv - 0.5;
          float dist = length(uv);
          float mask = smoothstep(0.55, 0.05, dist);
          float pattern = caustic(uv * 2.2 + 0.5);
          float glow = pow(pattern, 2.2) * mask * uIntensity * 0.22;
          vec3 color = mix(vec3(0.05, 0.25, 0.4), vec3(0.4, 0.9, 1.0), pattern);
          gl_FragColor = vec4(color, glow);
        }
      `,
    });
  }

  useFrame((state) => {
    const material = matRef.current;
    if (!material) return;

    material.uniforms.uTime.value = reducedMotion
      ? 0
      : state.clock.elapsedTime;
    material.uniforms.uIntensity.value = 0.45 + intensityRef.current * 0.7;

    if (meshRef.current && !reducedMotion) {
      meshRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.05) * 0.08;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1.85, 0]}
      material={matRef.current}
    >
      <planeGeometry args={[14, 14, 1, 1]} />
    </mesh>
  );
}
