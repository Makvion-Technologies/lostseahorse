export const RECENT_UPLOADS_KEY = "lostseahorse.recentUploads";
export const MAX_RECENT_UPLOADS = 30;

export type RecentUpload = {
  id: string;
  name: string;
  text: string;
  at: number;
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function fileName(name: string) {
  const trimmed = name.replace(/^.*[/\\]/, "").trim();
  return trimmed || "Untitled.txt";
}

function parseList(raw: unknown): RecentUpload[] {
  if (!Array.isArray(raw)) return [];
  const items: RecentUpload[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const data = entry as Record<string, unknown>;
    if (typeof data.id !== "string" || !data.id) continue;
    if (typeof data.name !== "string" || typeof data.text !== "string") continue;
    if (!data.text.trim()) continue;
    items.push({
      id: data.id,
      name: fileName(data.name),
      text: data.text,
      at: typeof data.at === "number" && Number.isFinite(data.at) ? data.at : 0,
    });
  }
  return items;
}

export function loadRecentUploads(): RecentUpload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_UPLOADS_KEY);
    if (!raw) return [];
    return parseList(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function writeRecentUploads(list: RecentUpload[]): RecentUpload[] {
  const next = list.slice(0, MAX_RECENT_UPLOADS);
  if (typeof window === "undefined") return next;
  for (let size = next.length; size >= 0; size--) {
    const slice = next.slice(0, size);
    try {
      window.localStorage.setItem(RECENT_UPLOADS_KEY, JSON.stringify(slice));
      return slice;
    } catch {
      continue;
    }
  }
  return next;
}

export function addRecentUpload(name: string, text: string): RecentUpload[] {
  const normalized = text.trim();
  if (!normalized) return loadRecentUploads();
  const label = fileName(name);
  const prev = loadRecentUploads().filter(
    (item) => item.text !== normalized || item.name !== label,
  );
  const item: RecentUpload = {
    id: uid(),
    name: label,
    text: normalized,
    at: Date.now(),
  };
  return writeRecentUploads([item, ...prev]);
}

export function touchRecentUpload(id: string): RecentUpload[] {
  const list = loadRecentUploads();
  const item = list.find((entry) => entry.id === id);
  if (!item) return list;
  return writeRecentUploads([
    { ...item, at: Date.now() },
    ...list.filter((entry) => entry.id !== id),
  ]);
}

export function removeRecentUpload(id: string): RecentUpload[] {
  return writeRecentUploads(
    loadRecentUploads().filter((item) => item.id !== id),
  );
}

export function clearRecentUploads(): RecentUpload[] {
  return writeRecentUploads([]);
}
