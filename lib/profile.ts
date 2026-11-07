"use client";

import { partyHost } from "./env";
import { PROFILE_ID_RE, type Profile } from "./profileName";

const ID_KEY = "lostseahorse.pid";
const CACHE_KEY = "lostseahorse.profile";
const COOKIE = "ls_pid";

function readCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function writeCookie(id: string) {
  // ~5 years; survives localStorage being cleared on its own.
  document.cookie = `${COOKIE}=${encodeURIComponent(id)}; max-age=157680000; path=/; samesite=lax`;
}

function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** This device's player key. Stored in localStorage with a cookie backup. */
export function deviceId(): string {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(ID_KEY);
  } catch {
    /* blocked storage */
  }
  if (!stored || !PROFILE_ID_RE.test(stored)) {
    const cookie = readCookie();
    stored = cookie && PROFILE_ID_RE.test(cookie) ? cookie : newId();
  }
  try {
    window.localStorage.setItem(ID_KEY, stored);
  } catch {
    /* cookie still holds it */
  }
  writeCookie(stored);
  return stored;
}

export function readCachedProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Profile;
    return p && typeof p.name === "string" && typeof p.id === "string" ? p : null;
  } catch {
    return null;
  }
}

export function cacheProfile(profile: Profile | null) {
  try {
    if (profile) window.localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
    else window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function base(): string {
  const host = partyHost();
  const local = /^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(host);
  return `${local ? "http" : "https"}://${host}/parties/profiles/registry`;
}

export async function fetchProfile(id: string): Promise<Profile | null> {
  const res = await fetch(`${base()}/me?id=${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("profile fetch failed");
  const data = (await res.json()) as { profile?: Profile | null };
  return data.profile ?? null;
}

export async function checkName(
  id: string,
  name: string,
  signal?: AbortSignal,
): Promise<{ available: boolean; reason: string | null }> {
  const res = await fetch(
    `${base()}/check?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`,
    { cache: "no-store", signal },
  );
  if (!res.ok) throw new Error("check failed");
  return (await res.json()) as { available: boolean; reason: string | null };
}

export async function claimName(id: string, name: string): Promise<{ profile?: Profile; error?: string }> {
  const res = await fetch(`${base()}/name`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, name }),
  });
  try {
    return (await res.json()) as { profile?: Profile; error?: string };
  } catch {
    return { error: "Could not save. Try again." };
  }
}

export async function fetchLeaderboard(
  id: string,
  signal?: AbortSignal,
): Promise<import("./leaderboard").LeaderboardResponse> {
  const q = new URLSearchParams({ id });
  const res = await fetch(`${base()}/leaderboard?${q}`, { cache: "no-store", signal });
  if (!res.ok) throw new Error("leaderboard fetch failed");
  return (await res.json()) as import("./leaderboard").LeaderboardResponse;
}
