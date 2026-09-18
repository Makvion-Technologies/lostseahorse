export type WpmBand = {
  id: string;
  min: number;
  max: number;
};

const BANDS: WpmBand[] = [
  { id: "15-40", min: 15, max: 40 },
  { id: "25-60", min: 25, max: 60 },
  { id: "35-80", min: 35, max: 80 },
  { id: "55-100", min: 55, max: 100 },
  { id: "75+", min: 75, max: 400 },
];

export function bandForWpm(wpm: number | undefined): WpmBand | "any" {
  if (wpm == null || Number.isNaN(wpm)) return "any";
  if (wpm < 30) return BANDS[0]!;
  if (wpm < 50) return BANDS[1]!;
  if (wpm < 70) return BANDS[2]!;
  if (wpm < 90) return BANDS[3]!;
  return BANDS[4]!;
}

export function queueKey(
  level: string,
  time: number,
  band: WpmBand | "any",
): string {
  const bandId = band === "any" ? "any" : band.id;
  return `${level}:${time}:${bandId}`;
}

export function queueWaitMs(firstVisit: boolean, rng = Math.random): number {
  if (firstVisit) return 3000 + rng() * 2000;
  return 8000 + rng() * 4000;
}

export function firstVisitAiRange(
  level: "easy" | "medium" | "hard",
): [number, number] {
  if (level === "easy") return [40, 55];
  if (level === "medium") return [45, 65];
  return [40, 60];
}

export function bandRange(band: WpmBand | "any"): [number, number] {
  if (band === "any") return [35, 70];
  return [band.min, band.max];
}
