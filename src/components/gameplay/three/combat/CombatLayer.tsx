"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { combatRuntime } from "@/game/combat/CombatRuntime";
import { combatSystem } from "@/game/systems/CombatSystem";
import type {
  CombatExplosion,
  CombatImpact,
  CombatProjectile,
  CombatWrongSpark,
} from "@/game/combat/types";
import { WordLabel } from "../enemies/WordLabel";

const PROJECTILE_GEO = new THREE.SphereGeometry(1, 12, 12);
const BUBBLE_GEO = new THREE.SphereGeometry(1, 6, 6);
const RING_GEO = new THREE.RingGeometry(0.15, 0.55, 24);
const WRONG_SPARK_COUNT = 12;

/**
 * Renders combat VFX and advances CombatSystem each frame.
 * Typing remains the source of truth — this only visualizes events.
 * Mesh nodes are pooled and reused — never recreated per attack.
 */
export function CombatLayer({
  reducedMotion = false,
  densityScale = 1,
}: {
  reducedMotion?: boolean;
  densityScale?: number;
}) {
  const [, setTick] = useState(0);
  const projectileGroup = useRef<THREE.Group>(null);
  const impactGroup = useRef<THREE.Group>(null);
  const explosionGroup = useRef<THREE.Group>(null);
  const wrongSparkGroup = useRef<THREE.Group>(null);
  const densityRef = useRef(densityScale);
  densityRef.current = densityScale;

  const projectileMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#67e8f9",
        emissive: "#22d3ee",
        emissiveIntensity: 1.4,
        transparent: true,
        opacity: 0.92,
        roughness: 0.15,
        metalness: 0.2,
        depthWrite: false,
      }),
    [],
  );
  const projectileFinalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#a5f3fc",
        emissive: "#2dd4bf",
        emissiveIntensity: 2.1,
        transparent: true,
        opacity: 0.95,
        roughness: 0.12,
        metalness: 0.25,
        depthWrite: false,
      }),
    [],
  );
  const bubbleMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#a5f3fc",
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    [],
  );
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#5eead4",
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const wrongSparkMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#f43f5e",
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(() => {
    combatSystem.init();
    const unsub = combatRuntime.subscribe(() => {
      setTick((v) => (v + 1) % 100000);
    });
    return () => {
      unsub();
      combatSystem.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    combatSystem.update(delta);
    const d = densityRef.current;
    syncProjectiles(projectileGroup.current, combatRuntime.projectiles, {
      normal: projectileMat,
      final: projectileFinalMat,
      bubble: bubbleMat,
    });
    syncImpacts(
      impactGroup.current,
      combatRuntime.impacts,
      bubbleMat,
      reducedMotion,
      d,
    );
    syncExplosions(
      explosionGroup.current,
      combatRuntime.explosions,
      bubbleMat,
      ringMat,
      reducedMotion,
      d,
    );
    syncWrongSparks(
      wrongSparkGroup.current,
      combatRuntime.wrongSparks,
      wrongSparkMat,
      reducedMotion,
      d,
    );
  });

  // Letter debris labels (React Text — spawn/despawn only)
  const letterDebris = combatRuntime.impacts.filter((i) => i.alive);

  return (
    <group>
      <group ref={projectileGroup} />
      <group ref={impactGroup} />
      <group ref={explosionGroup} />
      <group ref={wrongSparkGroup} />

      {letterDebris.map((imp) => (
        <LetterDebris key={imp.id} impact={imp} />
      ))}
    </group>
  );
}

function LetterDebris({ impact }: { impact: CombatImpact }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current || !impact.alive) return;
    const u = Math.min(1, impact.age / impact.duration);
    const rise = u * 0.55;
    const out = u * 0.25;
    ref.current.position.set(
      impact.position.x + out,
      impact.position.y + rise,
      impact.position.z,
    );
    ref.current.scale.setScalar(1 + u * 0.35);
    const opacity = 1 - u;
    ref.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.material && "opacity" in (mesh.material as THREE.Material)) {
        (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    });
  });

  return (
    <group
      ref={ref}
      position={[impact.position.x, impact.position.y, impact.position.z]}
    >
      <WordLabel
        text={impact.letter}
        color="#ecfeff"
        outlineColor="#67e8f9"
        opacity={0.95}
        height={0.32}
        active
      />
    </group>
  );
}

function syncProjectiles(
  group: THREE.Group | null,
  list: CombatProjectile[],
  mats: {
    normal: THREE.MeshStandardMaterial;
    final: THREE.MeshStandardMaterial;
    bubble: THREE.MeshBasicMaterial;
  },
): void {
  if (!group) return;
  const alive = list.filter((p) => p.alive);

  while (group.children.length < alive.length) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(PROJECTILE_GEO, mats.normal);
    core.name = "core";
    g.add(core);
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(BUBBLE_GEO, mats.bubble.clone());
      b.name = `trail${i}`;
      g.add(b);
    }
    group.add(g);
  }

  for (let i = 0; i < group.children.length; i++) {
    const node = group.children[i] as THREE.Group;
    const p = alive[i];
    if (!p) {
      node.visible = false;
      continue;
    }
    node.visible = true;
    const pos = combatRuntime.projectilePosition(p);
    node.position.set(pos.x, pos.y, pos.z);
    const core = node.children[0] as THREE.Mesh;
    core.material = p.isFinal ? mats.final : mats.normal;
    const scale = p.isFinal ? 0.14 : 0.07;
    core.scale.setScalar(scale);

    for (let t = 0; t < 3; t++) {
      const trail = node.children[t + 1] as THREE.Mesh;
      if (!trail) continue;
      const back = (t + 1) * 0.04;
      const e = Math.max(0, p.t - back * 0.15);
      const prev = combatRuntime.projectilePosition({ ...p, t: e });
      trail.position.set(
        prev.x - pos.x,
        prev.y - pos.y - 0.01,
        prev.z - pos.z,
      );
      trail.scale.setScalar(scale * (0.35 - t * 0.08));
      const mat = trail.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 * (1 - t * 0.25);
    }
  }
}

const SPLASH_GEO = new THREE.CircleGeometry(0.2, 12);

function syncImpacts(
  group: THREE.Group | null,
  list: CombatImpact[],
  bubbleMat: THREE.MeshBasicMaterial,
  reducedMotion: boolean,
  densityScale = 1,
): void {
  if (!group) return;
  const bubbleCount = Math.max(3, Math.round(6 * densityScale));
  const alive: CombatImpact[] = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].alive) alive.push(list[i]);
  }

  while (group.children.length < alive.length) {
    const g = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(BUBBLE_GEO, bubbleMat.clone());
      m.name = `b${i}`;
      g.add(m);
    }
    const splash = new THREE.Mesh(
      SPLASH_GEO,
      new THREE.MeshBasicMaterial({
        color: "#99f6e4",
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    splash.name = "splash";
    g.add(splash);
    group.add(g);
  }

  for (let i = 0; i < group.children.length; i++) {
    const node = group.children[i] as THREE.Group;
    const imp = alive[i];
    if (!imp) {
      node.visible = false;
      continue;
    }
    node.visible = true;
    node.position.set(imp.position.x, imp.position.y, imp.position.z);
    const u = Math.min(1, imp.age / imp.duration);

    for (let b = 0; b < 8; b++) {
      const bubble = node.children[b] as THREE.Mesh;
      if (!bubble || bubble.name === "splash") continue;
      const active = b < bubbleCount;
      bubble.visible = active;
      if (!active) continue;
      const ang = (b / bubbleCount) * Math.PI * 2;
      const rise = u * (0.35 + (b % 3) * 0.08);
      const rad = u * 0.2;
      bubble.position.set(
        Math.cos(ang) * rad,
        reducedMotion ? rise * 0.3 : rise,
        Math.sin(ang) * rad * 0.4,
      );
      bubble.scale.setScalar(0.02 + (1 - u) * 0.03);
      (bubble.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - u);
    }

    const splash = node.children.find((c) => c.name === "splash") as THREE.Mesh;
    if (splash) {
      const s = 0.3 + u * 1.4;
      splash.scale.set(s, s, s);
      (splash.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - u);
    }
  }
}

function syncExplosions(
  group: THREE.Group | null,
  list: CombatExplosion[],
  bubbleMat: THREE.MeshBasicMaterial,
  ringMat: THREE.MeshBasicMaterial,
  reducedMotion: boolean,
  densityScale = 1,
): void {
  if (!group) return;
  const bubbleCount = Math.max(6, Math.round(16 * densityScale));
  const fragCount = Math.max(4, Math.round(8 * densityScale));
  const alive: CombatExplosion[] = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].alive) alive.push(list[i]);
  }

  while (group.children.length < alive.length) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(RING_GEO, ringMat.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.name = "ring";
    g.add(ring);
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(BUBBLE_GEO, bubbleMat.clone());
      m.name = `b${i}`;
      g.add(m);
    }
    for (let i = 0; i < 8; i++) {
      const frag = new THREE.Mesh(
        PROJECTILE_GEO,
        new THREE.MeshBasicMaterial({
          color: "#5eead4",
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      frag.name = `frag${i}`;
      g.add(frag);
    }
    group.add(g);
  }

  for (let i = 0; i < group.children.length; i++) {
    const node = group.children[i] as THREE.Group;
    const ex = alive[i];
    if (!ex) {
      node.visible = false;
      continue;
    }
    node.visible = true;
    node.position.set(ex.position.x, ex.position.y, ex.position.z);
    const u = Math.min(1, ex.age / ex.duration);

    const ring = node.children.find((c) => c.name === "ring") as THREE.Mesh;
    if (ring) {
      const s = 0.4 + u * 3.2;
      ring.scale.set(s, s, s);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - u);
    }

    let bi = 0;
    for (const child of node.children) {
      if (child.name === "ring" || child.name.startsWith("frag")) continue;
      const bubble = child as THREE.Mesh;
      const active = bi < bubbleCount;
      bubble.visible = active;
      if (active) {
        const ang = (bi / bubbleCount) * Math.PI * 2;
        const rise = u * (0.8 + (bi % 4) * 0.15);
        const rad = u * (0.5 + (bi % 5) * 0.08);
        bubble.position.set(
          Math.cos(ang) * rad,
          reducedMotion ? rise * 0.4 : rise,
          Math.sin(ang) * rad,
        );
        bubble.scale.setScalar(0.03 + (1 - u) * 0.05);
        (bubble.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - u);
      }
      bi += 1;
    }

    for (let f = 0; f < 8; f++) {
      const frag = node.children.find((c) => c.name === `frag${f}`) as THREE.Mesh;
      if (!frag) continue;
      const active = f < fragCount;
      frag.visible = active;
      if (!active) continue;
      const ang = (f / fragCount) * Math.PI * 2 + u * 0.5;
      const rad = u * 0.9;
      frag.position.set(
        Math.cos(ang) * rad,
        reducedMotion ? u * 0.3 : u * 0.55 + Math.sin(ang * 2) * 0.1,
        Math.sin(ang) * rad,
      );
      frag.scale.setScalar(0.04 * (1 - u * 0.7));
      (frag.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - u);
    }
  }
}

function hash01(seed: number, i: number): number {
  const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function syncWrongSparks(
  group: THREE.Group | null,
  list: CombatWrongSpark[],
  sparkMat: THREE.MeshBasicMaterial,
  reducedMotion: boolean,
  densityScale = 1,
): void {
  if (!group) return;
  const count = Math.max(6, Math.round(WRONG_SPARK_COUNT * densityScale));
  const alive: CombatWrongSpark[] = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].alive) alive.push(list[i]);
  }

  while (group.children.length < alive.length) {
    const g = new THREE.Group();
    for (let i = 0; i < WRONG_SPARK_COUNT; i++) {
      const m = new THREE.Mesh(BUBBLE_GEO, sparkMat.clone());
      m.name = `s${i}`;
      g.add(m);
    }
    // core flash disc
    const core = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 14),
      new THREE.MeshBasicMaterial({
        color: "#fb7185",
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    core.name = "core";
    g.add(core);
    group.add(g);
  }

  for (let i = 0; i < group.children.length; i++) {
    const node = group.children[i] as THREE.Group;
    const spark = alive[i];
    if (!spark) {
      node.visible = false;
      continue;
    }
    node.visible = true;
    node.position.set(spark.position.x, spark.position.y, spark.position.z);
    const u = Math.min(1, spark.age / spark.duration);
    const fade = 1 - u;

    for (let s = 0; s < WRONG_SPARK_COUNT; s++) {
      const mesh = node.children[s] as THREE.Mesh;
      if (!mesh || mesh.name === "core") continue;
      const active = s < count;
      mesh.visible = active;
      if (!active) continue;

      const ang = (s / count) * Math.PI * 2 + spark.seed * 0.001;
      const spread = 0.15 + u * (0.55 + hash01(spark.seed, s) * 0.35);
      const lift = reducedMotion
        ? u * 0.12
        : u * (0.25 + hash01(spark.seed, s + 3) * 0.35);
      mesh.position.set(
        Math.cos(ang) * spread,
        lift + Math.sin(ang * 1.7) * u * 0.08,
        Math.sin(ang) * spread * 0.35,
      );
      const sc = (0.025 + (1 - u) * 0.045) * (0.7 + hash01(spark.seed, s + 7));
      mesh.scale.setScalar(sc);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      // Mix hot red → dark rose
      mat.color.set(s % 2 === 0 ? "#f43f5e" : "#fb7185");
      mat.opacity = 0.95 * fade;
    }

    const core = node.children.find((c) => c.name === "core") as THREE.Mesh;
    if (core) {
      const s = 0.35 + u * 1.1;
      core.scale.set(s, s, s);
      (core.material as THREE.MeshBasicMaterial).opacity = 0.5 * fade * fade;
    }
  }
}
