"use client";

import { useCallback, useSyncExternalStore } from "react";
import { cacheProfile, deviceId, fetchProfile, readCachedProfile } from "@/lib/profile";
import type { Profile } from "@/lib/profileName";

type ProfileState = {
  /** loading: nothing known yet; none: needs a name; ready: profile set. */
  status: "loading" | "none" | "ready";
  profile: Profile | null;
  id: string;
  /** Server unreachable: showing the cached profile (if any). */
  offline: boolean;
};

const SERVER: ProfileState = { status: "loading", profile: null, id: "", offline: false };
let state: ProfileState = SERVER;
let started = false;
const listeners = new Set<() => void>();

function set(next: ProfileState) {
  state = next;
  listeners.forEach((fn) => fn());
}

async function refresh() {
  const id = state.id || deviceId();
  try {
    const profile = await fetchProfile(id);
    cacheProfile(profile);
    set({ status: profile ? "ready" : "none", profile, id, offline: false });
  } catch {
    const cached = readCachedProfile();
    set({
      status: cached && cached.id === id ? "ready" : "none",
      profile: cached && cached.id === id ? cached : null,
      id,
      offline: true,
    });
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const id = deviceId();
  const cached = readCachedProfile();
  // Show the cached name at once; the server answer replaces it.
  state = cached && cached.id === id
    ? { status: "ready", profile: cached, id, offline: false }
    : { status: "loading", profile: null, id, offline: false };
  void refresh();
}

function subscribe(fn: () => void) {
  start();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setProfile(profile: Profile) {
  cacheProfile(profile);
  set({ status: "ready", profile, id: profile.id, offline: false });
}

export function useProfile() {
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER);
  const reload = useCallback(() => void refresh(), []);
  return { ...snap, reload };
}
