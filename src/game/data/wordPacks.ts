/**
 * Local word pack registry.
 * Packs are plain JSON word lists — SpawnSystem remains the sole consumer for gameplay.
 */

import general from "@/data/packs/general.json";
import programming from "@/data/packs/programming.json";
import space from "@/data/packs/space.json";
import animals from "@/data/packs/animals.json";
import countries from "@/data/packs/countries.json";
import technology from "@/data/packs/technology.json";

export type WordPackId =
  | "general"
  | "programming"
  | "space"
  | "animals"
  | "countries"
  | "technology";

export interface WordPackMeta {
  id: WordPackId;
  label: string;
  description: string;
}

export interface WordPack extends WordPackMeta {
  words: string[];
}

function normalizeWords(raw: string[]): string[] {
  return Array.from(
    new Set(
      raw
        .map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))
        .filter((w) => w.length >= 2),
    ),
  );
}

const PACK_DEFS: Array<{
  id: WordPackId;
  label: string;
  description: string;
  data: { words: string[] };
}> = [
  {
    id: "general",
    label: "General",
    description: "Everyday ocean-tinged vocabulary",
    data: general,
  },
  {
    id: "programming",
    label: "Programming",
    description: "Code, APIs, and developer terms",
    data: programming,
  },
  {
    id: "space",
    label: "Space",
    description: "Stars, orbits, and cosmic words",
    data: space,
  },
  {
    id: "animals",
    label: "Animals",
    description: "Creatures of land, air, and sea",
    data: animals,
  },
  {
    id: "countries",
    label: "Countries",
    description: "Nations and places around the world",
    data: countries,
  },
  {
    id: "technology",
    label: "Technology",
    description: "Hardware, networks, and digital life",
    data: technology,
  },
];

export const WORD_PACKS: WordPack[] = PACK_DEFS.map((p) => ({
  id: p.id,
  label: p.label,
  description: p.description,
  words: normalizeWords(p.data.words),
}));

export const WORD_PACK_META: WordPackMeta[] = WORD_PACKS.map(
  ({ id, label, description }) => ({ id, label, description }),
);

export const DEFAULT_WORD_PACK_ID: WordPackId = "general";

const byId = new Map(WORD_PACKS.map((p) => [p.id, p]));

export function getWordPack(id: WordPackId): WordPack {
  return byId.get(id) ?? WORD_PACKS[0];
}

export function getWordPool(id: WordPackId): string[] {
  return getWordPack(id).words;
}

export function isWordPackId(value: string): value is WordPackId {
  return byId.has(value as WordPackId);
}
