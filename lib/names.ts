const ALLOWED = /[^A-Za-z0-9 _.-]/g;

export function sanitizeName(raw: unknown, fallback = "racer"): string {
  if (typeof raw !== "string") return fallback;
  const stripped = raw.replace(/<[^>]*>/g, "").replace(ALLOWED, "");
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  const clipped = collapsed.slice(0, 16);
  return clipped.length >= 2 ? clipped : fallback;
}

export function isValidName(raw: string): boolean {
  const name = sanitizeName(raw, "");
  return name.length >= 2 && name.length <= 16;
}
