import { FRIENDS_MAX, FRIENDS_MIN } from "./party/events";

export const FRIENDS_KEY = "lostseahorse.friends";

/** Room sizes: Duo, Trio, Squad (5), or a custom cap. */
export const FRIEND_SIZES = ["duo", "trio", "squad", "custom"] as const;
export type FriendSize = (typeof FRIEND_SIZES)[number];

export const SIZE_MAX: Record<Exclude<FriendSize, "custom">, number> = { duo: 2, trio: 3, squad: 5 };

export type FriendPrefs = { size: FriendSize; custom: number };

export const DEFAULT_FRIENDS: FriendPrefs = { size: "duo", custom: 4 };

export function clampMax(n: number): number {
  return Math.max(FRIENDS_MIN, Math.min(FRIENDS_MAX, Math.round(Number.isFinite(n) ? n : FRIENDS_MIN)));
}

export function maxOf(prefs: FriendPrefs): number {
  return prefs.size === "custom" ? clampMax(prefs.custom) : SIZE_MAX[prefs.size];
}

/** "Duo", "Trio", "Squad" or "8 racers". */
export function sizeName(max: number): string {
  if (max === 2) return "Duo";
  if (max === 3) return "Trio";
  if (max === 5) return "Squad";
  return `${max} racers`;
}

export function loadFriendPrefs(): FriendPrefs {
  if (typeof window === "undefined") return DEFAULT_FRIENDS;
  try {
    const raw = window.localStorage.getItem(FRIENDS_KEY);
    if (!raw) return DEFAULT_FRIENDS;
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      size: FRIEND_SIZES.includes(data.size as FriendSize) ? (data.size as FriendSize) : DEFAULT_FRIENDS.size,
      custom: typeof data.custom === "number" ? clampMax(data.custom) : DEFAULT_FRIENDS.custom,
    };
  } catch {
    return DEFAULT_FRIENDS;
  }
}

export function saveFriendPrefs(prefs: FriendPrefs) {
  try {
    window.localStorage.setItem(FRIENDS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode: keep in memory only */
  }
}
