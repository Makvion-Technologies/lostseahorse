"use client";

/**
 * Piranha-shaped word carrier — canvas silhouette with readable text on the body.
 * No remote fonts / Suspense.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type PiranhaTone = "default" | "active" | "next" | "wrong";

interface PiranhaLabelProps {
  text: string;
  /** Face swimming direction: true = head points +X (right) */
  faceRight?: boolean;
  opacity?: number;
  /** World-space height of the fish plane */
  height?: number;
  tone?: PiranhaTone;
  badge?: "NOW" | "NEXT" | null;
}

const TONES: Record<
  PiranhaTone,
  {
    body: string;
    bodyDark: string;
    belly: string;
    fin: string;
    eye: string;
    text: string;
    outline: string;
    teeth: string;
    glow: string;
  }
> = {
  default: {
    body: "#0e7490",
    bodyDark: "#155e75",
    belly: "#67e8f9",
    fin: "#0891b2",
    eye: "#ecfeff",
    text: "#ecfeff",
    outline: "#22d3ee",
    teeth: "#f8fafc",
    glow: "rgba(34, 211, 238, 0.25)",
  },
  active: {
    body: "#ca8a04",
    bodyDark: "#a16207",
    belly: "#fef08a",
    fin: "#eab308",
    eye: "#fffbeb",
    text: "#fffbeb",
    outline: "#facc15",
    teeth: "#fefce8",
    glow: "rgba(250, 204, 21, 0.35)",
  },
  next: {
    body: "#854d0e",
    bodyDark: "#713f12",
    belly: "#fde68a",
    fin: "#a16207",
    eye: "#fef3c7",
    text: "#fef9c3",
    outline: "#ca8a04",
    teeth: "#fef3c7",
    glow: "rgba(161, 98, 7, 0.3)",
  },
  wrong: {
    body: "#be123c",
    bodyDark: "#9f1239",
    belly: "#fda4af",
    fin: "#e11d48",
    eye: "#fff1f2",
    text: "#ffe4e6",
    outline: "#fb7185",
    teeth: "#fff1f2",
    glow: "rgba(244, 63, 94, 0.4)",
  },
};

function paintPiranha(
  canvas: HTMLCanvasElement,
  text: string,
  faceRight: boolean,
  tone: PiranhaTone,
  badge: "NOW" | "NEXT" | null,
): { aspect: number } {
  const palette = TONES[tone];
  const ctx = canvas.getContext("2d");
  if (!ctx) return { aspect: 2.4 };

  const fontSize = 52;
  ctx.font = `800 ${fontSize}px system-ui, "Segoe UI", sans-serif`;
  const textW = Math.ceil(ctx.measureText(text || " ").width);
  // Fish scales with word length
  const bodyW = Math.max(220, textW + 140);
  const bodyH = 120;
  const pad = 28;
  const w = bodyW + pad * 2;
  const h = bodyH + pad * 2 + (badge ? 28 : 0);

  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + (badge ? 10 : 0);
  const bw = bodyW * 0.42;
  const bh = bodyH * 0.32;

  ctx.save();
  ctx.translate(cx, cy);
  // Base geometry: mouth on +X (faces right). Flip only when facing left.
  if (!faceRight) ctx.scale(-1, 1);

  // Soft glow under fish
  const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, bw * 1.4);
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, 8, bw * 1.15, bh * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail (left when facing left)
  ctx.fillStyle = palette.fin;
  ctx.beginPath();
  ctx.moveTo(-bw * 0.85, 0);
  ctx.lineTo(-bw * 1.45, -bh * 0.95);
  ctx.lineTo(-bw * 1.2, 0);
  ctx.lineTo(-bw * 1.45, bh * 0.95);
  ctx.closePath();
  ctx.fill();

  // Body
  const bodyGrad = ctx.createLinearGradient(0, -bh, 0, bh);
  bodyGrad.addColorStop(0, palette.body);
  bodyGrad.addColorStop(0.55, palette.bodyDark);
  bodyGrad.addColorStop(1, palette.belly);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, bw, bh, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body outline
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Dorsal fin
  ctx.fillStyle = palette.fin;
  ctx.beginPath();
  ctx.moveTo(-bw * 0.15, -bh * 0.85);
  ctx.lineTo(bw * 0.1, -bh * 1.55);
  ctx.lineTo(bw * 0.35, -bh * 0.75);
  ctx.closePath();
  ctx.fill();

  // Pelvic fin
  ctx.beginPath();
  ctx.moveTo(-bw * 0.05, bh * 0.7);
  ctx.lineTo(bw * 0.15, bh * 1.25);
  ctx.lineTo(bw * 0.28, bh * 0.55);
  ctx.closePath();
  ctx.fill();

  // Head / snout (right side of left-facing fish)
  ctx.fillStyle = palette.body;
  ctx.beginPath();
  ctx.ellipse(bw * 0.55, bh * 0.08, bw * 0.42, bh * 0.72, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Open jaw
  ctx.fillStyle = palette.bodyDark;
  ctx.beginPath();
  ctx.moveTo(bw * 0.55, bh * 0.15);
  ctx.quadraticCurveTo(bw * 1.15, bh * 0.05, bw * 1.05, bh * 0.45);
  ctx.quadraticCurveTo(bw * 0.7, bh * 0.55, bw * 0.45, bh * 0.35);
  ctx.closePath();
  ctx.fill();

  // Teeth
  ctx.fillStyle = palette.teeth;
  const teeth = 5;
  for (let i = 0; i < teeth; i++) {
    const tx = bw * (0.7 + i * 0.07);
    const ty = bh * 0.22;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + 4, ty + 14);
    ctx.lineTo(tx + 8, ty);
    ctx.closePath();
    ctx.fill();
  }

  // Eye
  ctx.fillStyle = palette.eye;
  ctx.beginPath();
  ctx.arc(bw * 0.55, -bh * 0.15, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(bw * 0.58, -bh * 0.15, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(bw * 0.56, -bh * 0.18, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Gill line
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bw * 0.2, 0, bh * 0.55, -0.8, 0.8);
  ctx.stroke();

  ctx.restore();

  // Word text (not flipped — always readable)
  ctx.font = `800 ${fontSize}px system-ui, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = tone === "active" ? 7 : 5;
  ctx.strokeText(text, cx, cy + 2);
  ctx.fillStyle = palette.text;
  ctx.fillText(text, cx, cy + 2);

  // Badge above fish
  if (badge) {
    ctx.font = `800 22px system-ui, "Segoe UI", sans-serif`;
    ctx.strokeStyle = palette.outline;
    ctx.lineWidth = 4;
    ctx.strokeText(badge, cx, 18);
    ctx.fillStyle = palette.text;
    ctx.fillText(badge, cx, 18);
  }

  return { aspect: w / h };
}

export function PiranhaLabel({
  text,
  faceRight = false,
  opacity = 1,
  height = 0.72,
  tone = "default",
  badge = null,
}: PiranhaLabelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement("canvas");
    const { aspect } = paintPiranha(canvas, text, faceRight, tone, badge);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return { texture, aspect };
  }, [text, faceRight, tone, badge]);

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
        depthTest: false,
        opacity,
        toneMapped: false,
      });
    } else {
      matRef.current.map = texture;
      matRef.current.opacity = opacity;
      matRef.current.needsUpdate = true;
    }
  }, [texture, opacity]);

  useFrame(() => {
    if (matRef.current && matRef.current.opacity !== opacity) {
      matRef.current.opacity = opacity;
    }
  });

  const width = height * aspect;

  if (!matRef.current) {
    matRef.current = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity,
      toneMapped: false,
    });
  }

  return (
    <mesh
      ref={meshRef}
      material={matRef.current}
      scale={[width, height, 1]}
      renderOrder={40}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
