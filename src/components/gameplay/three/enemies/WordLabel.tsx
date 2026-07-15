"use client";

/**
 * Reliable 3D word label — no remote font / Suspense.
 * Uses a canvas texture so words always appear immediately.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface WordLabelProps {
  text: string;
  color?: string;
  outlineColor?: string;
  opacity?: number;
  /** World-space height of the label plane */
  height?: number;
  active?: boolean;
}

function paintLabel(
  canvas: HTMLCanvasElement,
  text: string,
  color: string,
  outlineColor: string,
  active: boolean,
): { aspect: number } {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { aspect: 2 };

  const fontSize = 64;
  const padX = 48;
  const padY = 28;
  ctx.font = `700 ${fontSize}px system-ui, "Segoe UI", sans-serif`;
  const metrics = ctx.measureText(text || " ");
  const textW = Math.ceil(metrics.width);
  const w = Math.max(128, textW + padX * 2);
  const h = fontSize + padY * 2;

  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);

  // Soft plate
  ctx.fillStyle = active
    ? "rgba(15, 118, 110, 0.55)"
    : "rgba(8, 47, 73, 0.5)";
  roundRect(ctx, 8, 8, w - 16, h - 16, 18);
  ctx.fill();

  ctx.font = `700 ${fontSize}px system-ui, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  // Outline
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = active ? 8 : 6;
  ctx.strokeText(text, w / 2, h / 2 + 2);

  // Fill
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2 + 2);

  return { aspect: w / h };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function WordLabel({
  text,
  color = "#f0fdff",
  outlineColor = "#5eead4",
  opacity = 1,
  height = 0.42,
  active = false,
}: WordLabelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement("canvas");
    const { aspect } = paintLabel(canvas, text, color, outlineColor, active);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return { texture, aspect };
  }, [text, color, outlineColor, active]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useEffect(() => {
    if (!matRef.current) {
      matRef.current = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false, // always draw above seahorse / ocean
        opacity,
        toneMapped: false,
      });
    } else {
      matRef.current.map = texture;
      matRef.current.opacity = opacity;
      matRef.current.depthTest = false;
      matRef.current.needsUpdate = true;
    }
  }, [texture, opacity]);

  useFrame(() => {
    if (matRef.current && matRef.current.opacity !== opacity) {
      matRef.current.opacity = opacity;
    }
  });

  const width = height * aspect;
  const mat = matRef.current;

  if (!mat) {
    // First paint — create material synchronously for first frame
    const m = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity,
      toneMapped: false,
    });
    matRef.current = m;
  }

  return (
    <mesh
      ref={meshRef}
      material={matRef.current!}
      scale={[width, height, 1]}
      renderOrder={40}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
