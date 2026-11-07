import { COLORS, STYLES, type ColorHex, type Level, type StyleId } from "../types";
import { bandRange, firstVisitAiRange, type WpmBand } from "../bands";
import { pick, randFloat } from "../rng";
import { BOT_NAMES } from "../racerNames";

export type AiRacer = {
  id: string;
  name: string;
  style: StyleId;
  color: ColorHex;
  homeWpm: number;
};

const NAMES = BOT_NAMES;

const WPMS = [
  22, 26, 28, 31, 33, 36, 38, 41, 43, 45, 47, 48, 50, 52, 54, 55,
  57, 58, 60, 62, 63, 65, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84,
  86, 88, 90, 93, 96, 24, 29, 34, 39, 44, 49, 53, 59, 64, 69, 73,
  77, 81, 85, 91, 97, 101, 27, 42, 56, 61, 67, 71, 75, 79, 87, 94,
];

function buildPool(): AiRacer[] {
  return NAMES.map((name, i) => ({
    id: `kelp-${i + 1}`,
    name,
    style: STYLES[i % STYLES.length]!.id,
    color: COLORS[i % COLORS.length]!,
    homeWpm: WPMS[i] ?? 50,
  }));
}

export const AI_POOL: AiRacer[] = buildPool();

export function pickAi(opts: {
  band: WpmBand | "any";
  level: Level;
  firstVisit: boolean;
  rng: () => number;
  exclude?: Set<string>;
}): AiRacer {
  const [min, max] = opts.firstVisit
    ? firstVisitAiRange(opts.level)
    : bandRange(opts.band);

  const eligible = AI_POOL.filter((racer) => {
    if (opts.exclude?.has(racer.id)) return false;
    return racer.homeWpm >= min - 5 && racer.homeWpm <= max + 5;
  });

  const source = eligible.length ? eligible : AI_POOL;
  const base = pick(source, opts.rng);
  const target = Math.round(
    Math.min(max, Math.max(min, randFloat(min, max, opts.rng))),
  );

  return {
    ...base,
    id: `${base.id}-${Math.floor(opts.rng() * 900 + 100)}`,
    homeWpm: target,
  };
}
