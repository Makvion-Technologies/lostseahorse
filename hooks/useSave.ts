"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_SAVE,
  parseSave,
  seedIdentitySnapshot,
  writeSave,
  type Save,
} from "@/lib/storage";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("lostseahorse:save", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("lostseahorse:save", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): string {
  return seedIdentitySnapshot();
}

function getServerSnapshot() {
  return "";
}

export function useSave() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  let save: Save = DEFAULT_SAVE;
  if (raw) {
    try {
      save = parseSave(JSON.parse(raw) as unknown);
    } catch {
      save = DEFAULT_SAVE;
    }
  }

  const update = useCallback((partial: Partial<Save>) => {
    writeSave(partial);
  }, []);

  return { save, ready, update };
}
