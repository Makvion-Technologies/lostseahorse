"use client";

import { useEffect, useState } from "react";

/**
 * Focus mode while typing: any typing key hides the chrome (navbar extras via
 * html[data-typing-focus], plus whatever the caller fades with `peek`), and
 * moving or touching the pointer brings it back. Shared by Solo and Strangers.
 */
export function useTypingFocus(active: boolean) {
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    if (!active) return;
    const onMove = () => setPeek(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("input, textarea") &&
        !target.closest("[data-typing-input]")
      )
        return;
      setPeek(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  const hidden = active && !peek;
  useEffect(() => {
    if (hidden) document.documentElement.dataset.typingFocus = "1";
    else delete document.documentElement.dataset.typingFocus;
    return () => {
      delete document.documentElement.dataset.typingFocus;
    };
  }, [hidden]);

  return { peek, setPeek, hidden };
}
